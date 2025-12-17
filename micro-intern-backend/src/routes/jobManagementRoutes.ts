import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { Internship } from "../models/internship";
import { User } from "../models/user";
import { Application } from "../models/application";
import { createNotification } from "../utils/notifications";
import { Anomaly } from "../models/anomaly";
import { TaskChatMessage } from "../models/taskChat";
import { Payment } from "../models/payment";

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

    // Check if rejection reason is invalid (missing or too short)
    if (!task.rejectionReason || task.rejectionReason.trim().length < 10) {
      // Create anomaly and dispute chat
      const anomaly = await Anomaly.create({
        type: "delayed_payment", // Using existing type, can add new type later
        severity: "high",
        taskId: task._id,
        employerId: task.employerId,
        studentId: task.acceptedStudentId,
        description: `Student reported rejection of job "${task.title}" without proper cause. Rejection reason: "${task.rejectionReason || "None provided"}"`,
        detectedAt: new Date(),
      });

      // Create initial dispute message
      const disputeMessage = await TaskChatMessage.create({
        taskId: task._id,
        senderId: req.user.id,
        text: `DISPUTE OPENED: Student has reported this rejection as invalid. The rejection reason provided was: "${task.rejectionReason || "None provided"}". Admin review required.`,
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
    } else {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is valid. Cannot report as anomaly.",
      });
    }
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

    // Calculate payment: original gold + 50% fee
    const payment = task.gold + Math.ceil(task.gold * 0.5);

    if (winner === "student") {
      // Student wins: gets payment
      student.gold = (student.gold || 0) + payment;
      await student.save();

      task.submissionStatus = "confirmed";
      task.status = "completed";
      task.completedAt = new Date();

      await createNotification(
        task.acceptedStudentId!.toString(),
        "dispute_resolved",
        "Dispute Resolved - You Won!",
        `Admin resolved the dispute in your favor. You received ${payment} gold (original ${task.gold} + 50% fee).`,
        task._id.toString(),
        req.user.id,
        { goldEarned: payment, reason }
      );
    } else {
      // Employer wins: gets refund (if they had escrowed)
      task.submissionStatus = "rejected";
      task.rejectionReason = reason || task.rejectionReason || "Dispute resolved in employer's favor";

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
      payment: winner === "student" ? payment : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to resolve dispute" });
  }
});

export default router;

