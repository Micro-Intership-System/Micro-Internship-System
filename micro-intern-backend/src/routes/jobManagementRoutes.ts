import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { Internship } from "../models/internship";
import { User } from "../models/user";
import { Application } from "../models/application";
import { createNotification } from "../utils/notifications";
import { Anomaly } from "../models/anomaly";
import { TaskChatMessage } from "../models/taskChat";
import { Payment } from "../models/payment";
import { TaskReview } from "../models/taskReview";

const router = Router();

/**
 * POST /api/jobs/cleanup
 * Cleanup disputed, hanging, and invalid jobs (admin only)
 * - Removes jobs that don't follow the new structure
 * - Resolves disputed jobs and returns coins appropriately
 * - Cleans up hanging jobs (stuck in certain states)
 * - Handles anomaly-related jobs
 */
router.post("/cleanup", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const cleanupReport = {
      invalidJobsDeleted: 0,
      disputedJobsResolved: 0,
      hangingJobsCleaned: 0,
      coinsRefunded: 0,
      coinsReturnedToStudents: 0,
      coinsReturnedToEmployers: 0,
      applicationsDeleted: 0,
      paymentsRefunded: 0,
      anomaliesResolved: 0,
      chatMessagesDeleted: 0,
    };

    // 1. Find and delete jobs that don't follow the new structure
    const invalidJobs = await Internship.find({
      $or: [
        { gold: { $exists: false } },
        { budget: { $exists: true } },
        { companyName: { $exists: false } },
        { companyName: "" },
      ],
    });

    const invalidJobIds = invalidJobs.map((job) => job._id);
    if (invalidJobIds.length > 0) {
      await Application.deleteMany({ internshipId: { $in: invalidJobIds } });
      await Payment.deleteMany({ taskId: { $in: invalidJobIds } });
      await TaskChatMessage.deleteMany({ taskId: { $in: invalidJobIds } });
      await Anomaly.updateMany({ taskId: { $in: invalidJobIds } }, { status: "resolved", resolvedAt: new Date(), resolvedBy: req.user.id });
      const deleteResult = await Internship.deleteMany({ _id: { $in: invalidJobIds } });
      cleanupReport.invalidJobsDeleted = deleteResult.deletedCount || 0;
      cleanupReport.applicationsDeleted += invalidJobIds.length;
    }

    // 2. Find and resolve disputed jobs
    const disputedJobs = await Internship.find({
      submissionStatus: "disputed",
    }).populate("acceptedStudentId").populate("employerId");

    for (const job of disputedJobs) {
      const student = job.acceptedStudentId as any;
      const employer = job.employerId as any;

      // Find related payment
      const payment = await Payment.findOne({ taskId: job._id });

      if (payment) {
        // If payment was escrowed, refund to employer
        if (payment.status === "escrowed" || payment.status === "pending") {
          employer.gold = (employer.gold || 0) + payment.amount;
          await employer.save();
          payment.status = "refunded";
          payment.refundedAt = new Date();
          payment.refundedBy = req.user.id;
          payment.notes = "Refunded during cleanup of disputed job";
          await payment.save();
          cleanupReport.coinsReturnedToEmployers += payment.amount;
          cleanupReport.coinsRefunded += payment.amount;
        }
        // If payment was released, it stays with student (they won)
      }

      // Refund any cancellation fees student might have paid
      // (if they cancelled and then disputed, they should get fee back)
      if (student && job.status === "cancelled") {
        const feeRefund = Math.ceil(job.gold * 0.5);
        student.gold = (student.gold || 0) + feeRefund;
        await student.save();
        cleanupReport.coinsReturnedToStudents += feeRefund;
        cleanupReport.coinsRefunded += feeRefund;
      }

      // Mark job as cancelled and clean up
      job.status = "cancelled";
      job.submissionStatus = "pending";
      await job.save();

      // Resolve related anomalies
      const anomaliesUpdate = await Anomaly.updateMany(
        { taskId: job._id, status: { $in: ["open", "investigating"] } },
        { status: "resolved", resolvedAt: new Date(), resolvedBy: req.user.id, notes: "Resolved during cleanup" }
      );

      cleanupReport.disputedJobsResolved++;
      cleanupReport.anomaliesResolved += anomaliesUpdate.modifiedCount || 0;
    }

    // 3. Find and clean up hanging jobs (stuck in certain states)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Jobs submitted but not confirmed/rejected for >30 days
    const hangingSubmitted = await Internship.find({
      submissionStatus: "submitted",
      updatedAt: { $lt: thirtyDaysAgo },
    }).populate("acceptedStudentId").populate("employerId");

    for (const job of hangingSubmitted) {
      const student = job.acceptedStudentId as any;
      const employer = job.employerId as any;

      // Find and refund escrowed payment
      const payment = await Payment.findOne({ taskId: job._id });
      if (payment && (payment.status === "escrowed" || payment.status === "pending")) {
        employer.gold = (employer.gold || 0) + payment.amount;
        await employer.save();
        payment.status = "refunded";
        payment.refundedAt = new Date();
        payment.refundedBy = req.user.id;
        payment.notes = "Refunded during cleanup of hanging job";
        await payment.save();
        cleanupReport.coinsReturnedToEmployers += payment.amount;
        cleanupReport.coinsRefunded += payment.amount;
        cleanupReport.paymentsRefunded++;
      }

      // Mark as cancelled
      job.status = "cancelled";
      job.submissionStatus = "pending";
      await job.save();

      cleanupReport.hangingJobsCleaned++;
    }

    // Jobs in_progress for >60 days without submission
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const hangingInProgress = await Internship.find({
      status: "in_progress",
      submissionStatus: { $ne: "submitted" },
      acceptedAt: { $lt: sixtyDaysAgo },
    }).populate("acceptedStudentId").populate("employerId");

    for (const job of hangingInProgress) {
      const student = job.acceptedStudentId as any;
      const employer = job.employerId as any;

      // Refund any escrowed payment
      const payment = await Payment.findOne({ taskId: job._id });
      if (payment && (payment.status === "escrowed" || payment.status === "pending")) {
        employer.gold = (employer.gold || 0) + payment.amount;
        await employer.save();
        payment.status = "refunded";
        payment.refundedAt = new Date();
        payment.refundedBy = req.user.id;
        payment.notes = "Refunded during cleanup of hanging job";
        await payment.save();
        cleanupReport.coinsReturnedToEmployers += payment.amount;
        cleanupReport.coinsRefunded += payment.amount;
        cleanupReport.paymentsRefunded++;
      }

      // Refund cancellation fee if student paid it
      if (student) {
        const feeRefund = Math.ceil(job.gold * 0.5);
        student.gold = (student.gold || 0) + feeRefund;
        await student.save();
        cleanupReport.coinsReturnedToStudents += feeRefund;
        cleanupReport.coinsRefunded += feeRefund;
      }

      // Mark as cancelled
      job.status = "cancelled";
      job.submissionStatus = "pending";
      await job.save();

      cleanupReport.hangingJobsCleaned++;
    }

    // 4. Clean up related data for all cleaned jobs
    const allCleanedJobIds = [
      ...invalidJobIds,
      ...disputedJobs.map((j) => j._id),
      ...hangingSubmitted.map((j) => j._id),
      ...hangingInProgress.map((j) => j._id),
    ];

    if (allCleanedJobIds.length > 0) {
      // Delete applications
      const appsDeleted = await Application.deleteMany({ internshipId: { $in: allCleanedJobIds } });
      cleanupReport.applicationsDeleted += appsDeleted.deletedCount || 0;

      // Delete chat messages
      const messagesDeleted = await TaskChatMessage.deleteMany({ taskId: { $in: allCleanedJobIds } });
      cleanupReport.chatMessagesDeleted = messagesDeleted.deletedCount || 0;

      // Resolve all related anomalies
      const anomaliesResolved = await Anomaly.updateMany(
        { taskId: { $in: allCleanedJobIds }, status: { $in: ["open", "investigating"] } },
        { status: "resolved", resolvedAt: new Date(), resolvedBy: req.user.id, notes: "Resolved during cleanup" }
      );
      cleanupReport.anomaliesResolved += anomaliesResolved.modifiedCount || 0;
    }

    res.json({
      success: true,
      message: "Cleanup completed successfully",
      report: cleanupReport,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to cleanup jobs" });
  }
});

/**
 * GET /api/jobs/disputes
 * Get all disputed jobs (admin only)
 */
router.get("/disputes", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const jobs = await Internship.find({
      submissionStatus: "disputed",
    })
      .populate("acceptedStudentId", "name email")
      .populate("employerId", "name email companyName")
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load disputes" });
  }
});

/**
 * GET /api/jobs/submissions
 * Get all submitted jobs for the logged-in employer
 */
router.get("/submissions", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "employer") {
      return res.status(403).json({ success: false, message: "Employers only" });
    }

    const jobs = await Internship.find({
      employerId: req.user.id,
      submissionStatus: "submitted",
    })
      .populate("acceptedStudentId", "name email")
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load submissions" });
  }
});

/**
 * GET /api/jobs/running
 * Get all running jobs for the logged-in student
 */
router.get("/running", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const applications = await Application.find({
      studentId: req.user.id,
      status: "accepted",
    }).populate("internshipId");

    const runningJobs = applications
      .filter((app: any) => {
        const task = app.internshipId;
        return task && (task.status === "in_progress" || task.status === "posted");
      })
      .map((app: any) => {
        const task = app.internshipId;
        return {
          _id: task._id,
          title: task.title,
          companyName: task.companyName,
          gold: task.gold,
          deadline: task.deadline,
          status: task.status,
          submissionStatus: task.submissionStatus || "pending",
          acceptedAt: task.acceptedAt,
          submissionReport: task.submissionReport,
          submissionProofUrl: task.submissionProofUrl,
          rejectionReason: task.rejectionReason, // Include rejection reason
        };
      });

    res.json({ success: true, data: runningJobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load running jobs" });
  }
});

/**
 * POST /api/jobs/:id/submit
 * Student submits a job for review
 */
router.post("/:id/submit", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const task = await Internship.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (task.acceptedStudentId?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not your job" });
    }

    if (task.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Job must be in progress to submit",
      });
    }

    const { proofUrl, timeTaken, completionNotes } = req.body;

    // Calculate time taken if not provided
    let calculatedTimeTaken: number | undefined = timeTaken ? Number(timeTaken) : undefined;
    if (!calculatedTimeTaken && task.acceptedAt) {
      const hours = (Date.now() - task.acceptedAt.getTime()) / (1000 * 60 * 60);
      calculatedTimeTaken = Math.round(hours * 10) / 10; // Round to 1 decimal
    }
    // If still undefined, default to 0
    if (calculatedTimeTaken === undefined || isNaN(calculatedTimeTaken)) {
      calculatedTimeTaken = 0;
    }

    task.submissionStatus = "submitted";
    task.submissionProofUrl = proofUrl || undefined;
    task.submissionReport = {
      timeTaken: calculatedTimeTaken,
      completionNotes: completionNotes || "",
      submittedAt: new Date(),
    };

    await task.save();

    // Generate completion report and notify employer
    const student = await User.findById(req.user.id);
    const report = {
      jobTitle: task.title,
      studentName: student?.name || "Student",
      timeTaken: `${calculatedTimeTaken} hours`,
      completionNotes: completionNotes || "No additional notes provided.",
      submittedAt: new Date().toISOString(),
      proofUrl: proofUrl || "No proof provided.",
    };

    await createNotification(
      task.employerId.toString(),
      "task_submitted",
      "Job Submission Received",
      `Student has submitted job "${task.title}" for review.${calculatedTimeTaken > 0 ? ` Time taken: ${calculatedTimeTaken} hours.` : ""}`,
      task._id.toString(),
      req.user.id,
      { report }
    );

    res.json({ success: true, data: task, report });
  } catch (err) {
    console.error("Error submitting job:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ 
      success: false, 
      message: `Failed to submit job: ${errorMessage}` 
    });
  }
});

/**
 * POST /api/jobs/:id/cancel
 * Student cancels a job (deducts 50% coin fee)
 */
router.post("/:id/cancel", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const task = await Internship.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (task.acceptedStudentId?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not your job" });
    }

    if (task.status !== "in_progress" && task.status !== "posted") {
      return res.status(400).json({
        success: false,
        message: "Job cannot be cancelled in current state",
      });
    }

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Calculate 50% fee
    const fee = Math.ceil(task.gold * 0.5);
    const newGold = (student.gold || 0) - fee;

    // Update student gold (can go negative)
    student.gold = newGold;
    await student.save();

    // Update task status
    task.status = "cancelled";
    task.submissionStatus = "pending";
    await task.save();

    // Notify employer
    await createNotification(
      task.employerId.toString(),
      "task_cancelled",
      "Job Cancelled",
      `Student has cancelled job "${task.title}". A new student can now be accepted.`,
      task._id.toString(),
      req.user.id
    );

    res.json({
      success: true,
      data: task,
      feeDeducted: fee,
      newGoldBalance: newGold,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to cancel job" });
  }
});

/**
 * POST /api/jobs/:id/confirm
 * Employer confirms job submission (releases payment)
 */
router.post("/:id/confirm", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "employer") {
      return res.status(403).json({ success: false, message: "Employers only" });
    }

    const task = await Internship.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (task.employerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not your job" });
    }

    if (task.submissionStatus !== "submitted") {
      return res.status(400).json({
        success: false,
        message: `Job must be submitted to confirm. Current status: ${task.submissionStatus || "unknown"}`,
      });
    }

    if (!task.acceptedStudentId) {
      return res.status(400).json({
        success: false,
        message: "No student assigned to this job",
      });
    }

    const student = await User.findById(task.acceptedStudentId);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: `Student not found (ID: ${task.acceptedStudentId})` 
      });
    }

    if (!task.gold || task.gold <= 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid gold amount: ${task.gold}`,
      });
    }

    // Release payment
    task.submissionStatus = "confirmed";
    task.status = "completed";
    task.completedAt = new Date();
    await task.save();

    // Create or update Payment record
    const { Payment } = await import("../models/payment");
    let payment = await Payment.findOne({ taskId: task._id });
    
    if (!payment) {
      // Create new payment record
      payment = await Payment.create({
        taskId: task._id,
        employerId: task.employerId,
        studentId: task.acceptedStudentId,
        amount: task.gold,
        status: "released",
        type: "task_payment",
        releasedAt: new Date(),
        releasedBy: req.user.id,
      });
    } else {
      // Update existing payment record
      payment.status = "released";
      payment.releasedAt = new Date();
      payment.releasedBy = req.user.id;
      payment.amount = task.gold; // Update amount in case it changed
      await payment.save();
    }

    // Award gold to student
    const currentGold = student.gold || 0;
    student.gold = currentGold + task.gold;
    await student.save();

    // Notify student
    try {
      await createNotification(
        task.acceptedStudentId.toString(),
        "task_confirmed",
        "Job Confirmed!",
        `Your submission for "${task.title}" has been confirmed. You received ${task.gold} gold!`,
        task._id.toString(),
        req.user.id,
        { goldEarned: task.gold }
      );
    } catch (notifErr) {
      console.error("Failed to send notification (non-critical):", notifErr);
      // Continue even if notification fails
    }

    res.json({ 
      success: true, 
      data: task,
      goldAwarded: task.gold,
      studentNewBalance: student.gold
    });
  } catch (err) {
    console.error("Error confirming job:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ 
      success: false, 
      message: `Failed to confirm job: ${errorMessage}` 
    });
  }
});

/**
 * POST /api/jobs/:id/reject
 * Employer rejects job submission (must provide reason)
 */
router.post("/:id/reject", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "employer") {
      return res.status(403).json({ success: false, message: "Employers only" });
    }

    const task = await Internship.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (task.employerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not your job" });
    }

    if (task.submissionStatus !== "submitted") {
      return res.status(400).json({
        success: false,
        message: "Job must be submitted to reject",
      });
    }

    const { reason } = req.body;
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required and must be at least 10 characters",
      });
    }

    task.submissionStatus = "rejected";
    task.rejectionReason = reason.trim();
    await task.save();

    // Notify student
    await createNotification(
      task.acceptedStudentId!.toString(),
      "task_rejected",
      "Job Submission Rejected",
      `Your submission for "${task.title}" was rejected. Reason: ${reason}`,
      task._id.toString(),
      req.user.id,
      { reason: reason.trim() }
    );

    res.json({ success: true, data: task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to reject job" });
  }
});

/**
 * POST /api/jobs/:id/report-rejection
 * Student reports rejection as anomaly (creates dispute chat)
 */
router.post("/:id/report-rejection", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const task = await Internship.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (task.acceptedStudentId?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not your job" });
    }

    if (task.submissionStatus !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Job must be rejected to report",
      });
    }

    // Require 50% escrow payment from student
    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const escrowAmount = Math.ceil(task.gold * 0.5);
    if ((student.gold || 0) < escrowAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient gold. You need ${escrowAmount} gold (50% of job payment) to report this rejection as an anomaly.`,
      });
    }

    // Deduct escrow from student
    student.gold = (student.gold || 0) - escrowAmount;
    await student.save();

    // Store escrow amount in task for later resolution
    task.disputeEscrowAmount = escrowAmount;

    // Allow students to report rejections regardless of reason validity
    // Create anomaly and dispute chat
    const anomalyType = (!task.rejectionReason || task.rejectionReason.trim().length < 10) 
      ? "delayed_payment" // Invalid reason - higher severity
      : "task_stalled"; // Valid reason but student disputes - lower severity
    
    const severity = (!task.rejectionReason || task.rejectionReason.trim().length < 10)
      ? "high"
      : "medium";

    const anomaly = await Anomaly.create({
      type: anomalyType,
      severity: severity,
      taskId: task._id,
      employerId: task.employerId,
      studentId: task.acceptedStudentId,
      description: `Student reported rejection of job "${task.title}" as disputed. Rejection reason: "${task.rejectionReason || "None provided"}". Escrow: ${escrowAmount} gold.`,
      detectedAt: new Date(),
    });

    // Create initial dispute message
    const disputeMessage = await TaskChatMessage.create({
      taskId: task._id,
      senderId: req.user.id,
      text: `DISPUTE OPENED: Student has reported this rejection as disputed. The rejection reason provided was: "${task.rejectionReason || "None provided"}". Escrow amount: ${escrowAmount} gold. Admin review required.`,
      status: "sent",
    });

    task.submissionStatus = "disputed";
    task.disputeChatId = disputeMessage._id;
    await task.save();

    // Notify admin
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await createNotification(
        admin._id.toString(),
        "anomaly_detected",
        "Dispute Opened",
        `A dispute has been opened for job "${task.title}". Review required.`,
        task._id.toString(),
        req.user.id,
        { anomalyId: anomaly._id.toString() }
      );
    }

    res.json({
      success: true,
      data: task,
      anomaly,
      message: "Dispute opened and anomaly created",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to report rejection" });
  }
});

/**
 * POST /api/jobs/:id/resolve-dispute
 * Admin resolves dispute (supports either side)
 */
router.post("/:id/resolve-dispute", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const task = await Internship.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (task.submissionStatus !== "disputed") {
      return res.status(400).json({
        success: false,
        message: "Job is not in dispute",
      });
    }

    const { winner, reason } = req.body; // winner: "student" or "employer"
    if (!["student", "employer"].includes(winner)) {
      return res.status(400).json({
        success: false,
        message: "Winner must be 'student' or 'employer'",
      });
    }

    const student = await User.findById(task.acceptedStudentId);
    const employer = await User.findById(task.employerId);

    if (!student || !employer) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const escrowAmount = task.disputeEscrowAmount || Math.ceil(task.gold * 0.5);

    if (winner === "student") {
      // Student wins: gets 150% of original payment (original + escrow + 50% bonus)
      const totalPayment = task.gold + escrowAmount + Math.ceil(task.gold * 0.5); // Original + escrow + 50% bonus
      student.gold = (student.gold || 0) + totalPayment;
      await student.save();

      // Apply 7-day restriction to employer (can only post low priority jobs)
      const restrictionDate = new Date();
      restrictionDate.setDate(restrictionDate.getDate() + 7);
      // Ensure we're working with a fresh employer object from the database
      const freshEmployer = await User.findById(employer._id);
      if (freshEmployer) {
        freshEmployer.restrictionUntil = restrictionDate;
        freshEmployer.canOnlyPostLowPriority = true;
        const saved = await freshEmployer.save();
        console.log(`Restriction applied to employer ${saved._id}: until ${restrictionDate.toISOString()}, canOnlyPostLowPriority: ${saved.canOnlyPostLowPriority}`);
      } else {
        // Fallback to the employer object we already have
        employer.restrictionUntil = restrictionDate;
        employer.canOnlyPostLowPriority = true;
        const saved = await employer.save();
        console.log(`Restriction applied to employer ${saved._id}: until ${restrictionDate.toISOString()}, canOnlyPostLowPriority: ${saved.canOnlyPostLowPriority}`);
      }

      task.submissionStatus = "confirmed";
      task.status = "completed";
      task.completedAt = new Date();
      await task.save();

      // Create Payment record for dispute resolution (student won)
      const { Payment } = await import("../models/payment");
      let payment = await Payment.findOne({ taskId: task._id });
      
      if (!payment) {
        payment = await Payment.create({
          taskId: task._id,
          employerId: task.employerId,
          studentId: task.acceptedStudentId,
          amount: totalPayment, // Total amount including bonus
          status: "released",
          type: "task_payment",
          releasedAt: new Date(),
          releasedBy: req.user.id,
          notes: `Dispute resolved: Student won. Original: ${task.gold}, Escrow: ${escrowAmount}, Bonus: ${Math.ceil(task.gold * 0.5)}`,
        });
      } else {
        payment.status = "released";
        payment.amount = totalPayment;
        payment.releasedAt = new Date();
        payment.releasedBy = req.user.id;
        payment.notes = `Dispute resolved: Student won. Original: ${task.gold}, Escrow: ${escrowAmount}, Bonus: ${Math.ceil(task.gold * 0.5)}`;
        await payment.save();
      }

      await createNotification(
        task.acceptedStudentId!.toString(),
        "dispute_resolved",
        "Dispute Resolved - You Won!",
        `Admin resolved the dispute in your favor. You received ${totalPayment} gold (original ${task.gold} + escrow ${escrowAmount} + 50% bonus ${Math.ceil(task.gold * 0.5)}).`,
        task._id.toString(),
        req.user.id,
        { goldEarned: totalPayment, reason }
      );

      await createNotification(
        task.employerId.toString(),
        "dispute_resolved",
        "Dispute Resolved - Student Won",
        `Admin resolved the dispute in favor of the student. You have a 7-day restriction where you can only post low priority jobs. Reason: ${reason || "N/A"}`,
        task._id.toString(),
        req.user.id,
        { reason, restrictionUntil: restrictionDate }
      );
    } else {
      // Employer wins: student loses 50% of payment (escrow is forfeited)
      const penalty = escrowAmount; // The escrow amount is forfeited
      student.gold = Math.max(0, (student.gold || 0) - penalty); // Can go negative, but we'll keep it at 0 minimum
      await student.save();

      task.submissionStatus = "rejected";
      task.rejectionReason = reason || task.rejectionReason || "Dispute resolved in employer's favor";

      await createNotification(
        task.acceptedStudentId!.toString(),
        "dispute_resolved",
        "Dispute Resolved - Employer Won",
        `Admin resolved the dispute in favor of the employer. ${penalty} gold (50% of payment) has been deducted from your account. Reason: ${reason || "N/A"}`,
        task._id.toString(),
        req.user.id,
        { goldDeducted: penalty, reason }
      );

      await createNotification(
        task.employerId.toString(),
        "dispute_resolved",
        "Dispute Resolved - You Won!",
        `Admin resolved the dispute in your favor. Reason: ${reason || "N/A"}`,
        task._id.toString(),
        req.user.id,
        { reason }
      );
    }

    await task.save();

    // Update anomaly
    const anomaly = await Anomaly.findOne({
      taskId: task._id,
      status: { $in: ["open", "investigating"] },
    });
    if (anomaly) {
      anomaly.status = "resolved";
      anomaly.resolvedAt = new Date();
      anomaly.resolvedBy = req.user.id;
      anomaly.notes = `Dispute resolved. Winner: ${winner}. Reason: ${reason || "N/A"}`;
      await anomaly.save();
    }

    res.json({
      success: true,
      data: task,
      winner,
      payment: winner === "student" ? (task.gold + escrowAmount + Math.ceil(task.gold * 0.5)) : 0,
      penalty: winner === "employer" ? escrowAmount : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to resolve dispute" });
  }
});

/**
 * GET /api/jobs/completed
 * Get completed jobs for the logged-in user (student or employer) that are eligible for review
 */
router.get("/completed", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let completedJobs;
    if (userRole === "student") {
      // For students, find applications where status is accepted and internship is completed
      const applications = await Application.find({
        studentId: userId,
        status: "accepted",
      }).populate("internshipId");

      completedJobs = applications
        .filter((app: any) => app.internshipId && app.internshipId.status === "completed")
        .map((app: any) => ({
          _id: app.internshipId._id,
          title: app.internshipId.title,
          companyName: app.internshipId.companyName,
          completionDate: app.internshipId.completionDate,
          employerId: app.internshipId.employerId,
        }));
    } else if (userRole === "employer") {
      // For employers, find internships posted by them that are completed
      completedJobs = await Internship.find({
        employerId: userId,
        status: "completed",
      }).populate("acceptedStudentId", "name email");
    } else {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Check if reviews already exist for these jobs
    const jobsWithReviewStatus = await Promise.all(
      completedJobs.map(async (job: any) => {
        const existingReview = await TaskReview.findOne({
          taskId: job._id,
          reviewerId: userId,
          reviewedId: userRole === "student" ? job.employerId : job.acceptedStudentId._id,
        });
        return {
          ...job.toObject ? job.toObject() : job,
          reviewStatus: existingReview ? "submitted" : "pending",
        };
      })
    );

    res.json({ success: true, data: jobsWithReviewStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load completed jobs" });
  }
});

export default router;

