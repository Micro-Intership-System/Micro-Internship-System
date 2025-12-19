import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { User } from "../models/user";
import { Internship } from "../models/internship";
import { Payment } from "../models/payment";
import { calculateStarRating } from "../utils/gamification";
import { createNotification } from "../utils/notifications";

const router = Router();

/**
 * POST /api/admin/fix-user-roles
 * Fix user roles to match their actual role in database (admin only)
 */
router.post("/fix-user-roles", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    // Get all users and ensure they have valid roles
    const users = await User.find({});
    let fixed = 0;
    const issues: string[] = [];

    for (const user of users) {
      let needsFix = false;
      const oldRole = user.role;
      let newRole = user.role;

      // Check if role is missing or invalid
      if (!user.role || !["student", "employer", "admin"].includes(user.role)) {
        needsFix = true;
        // Try to determine role from other fields
        const hasEmployerFields = !!(user.companyName || user.companyWebsite || user.companyDescription || user.companyLogo || user.isVerified);
        // Check if user has posted any jobs
        const jobCount = await Internship.countDocuments({ postedBy: user._id });
        
        if (hasEmployerFields || jobCount > 0) {
          newRole = "employer";
        } else {
          newRole = "student";
        }
      }
      // Also check if role doesn't match the data
      else {
        const hasEmployerFields = !!(user.companyName || user.companyWebsite || user.companyDescription || user.companyLogo || user.isVerified);
        const jobCount = await Internship.countDocuments({ postedBy: user._id });
        
        // If user has employer fields or has posted jobs but role is not employer
        if ((hasEmployerFields || jobCount > 0) && user.role !== "employer") {
          needsFix = true;
          newRole = "employer";
        }
        // If user has student fields (institution, skills) but no employer fields and role is employer
        else if ((user.institution || (user.skills && user.skills.length > 0)) && !hasEmployerFields && jobCount === 0 && user.role === "employer") {
          needsFix = true;
          newRole = "student";
        }
      }

      if (needsFix) {
        user.role = newRole as any;
        await user.save();
        fixed++;
        issues.push(`User ${user.email}: Changed role from "${oldRole || "none"}" to "${newRole}"`);
      }
    }

    res.json({
      success: true,
      message: `Fixed ${fixed} user(s)`,
      fixed,
      issues,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fix user roles" });
  }
});

/**
 * DELETE /api/admin/jobs/:id
 * Delete a job (admin only)
 */
router.delete("/jobs/:id", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const { Internship } = await import("../models/internship");
    const { Application } = await import("../models/application");
    const { Payment } = await import("../models/payment");
    const { TaskChatMessage } = await import("../models/taskChat");
    const { Anomaly } = await import("../models/anomaly");

    const job = await Internship.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Delete related data
    await Application.deleteMany({ internshipId: job._id });
    await Payment.deleteMany({ taskId: job._id });
    await TaskChatMessage.deleteMany({ taskId: job._id });
    await Anomaly.deleteMany({ taskId: job._id });

    // Delete the job
    await Internship.findByIdAndDelete(job._id);

    res.json({ success: true, message: "Job deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (student or employer) (admin only)
 */
router.delete("/users/:id", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const { User } = await import("../models/user");
    const { Internship } = await import("../models/internship");
    const { Application } = await import("../models/application");
    const { Payment } = await import("../models/payment");
    const { TaskChatMessage } = await import("../models/taskChat");
    const { Anomaly } = await import("../models/anomaly");

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent deleting admin users
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Cannot delete admin users" });
    }

    // Delete related data based on role
    if (user.role === "employer") {
      // Delete employer's jobs and related data
      const jobs = await Internship.find({ employerId: user._id });
      for (const job of jobs) {
        await Application.deleteMany({ internshipId: job._id });
        await Payment.deleteMany({ taskId: job._id });
        await TaskChatMessage.deleteMany({ taskId: job._id });
        await Anomaly.deleteMany({ taskId: job._id });
      }
      await Internship.deleteMany({ employerId: user._id });
    } else if (user.role === "student") {
      // Delete student's applications
      await Application.deleteMany({ studentId: user._id });
      // Update jobs where student was accepted
      await Internship.updateMany(
        { acceptedStudentId: user._id },
        { $unset: { acceptedStudentId: "" }, status: "posted" }
      );
    }

    // Delete user's chat messages
    await TaskChatMessage.deleteMany({ senderId: user._id });
    // Delete anomalies related to user
    await Anomaly.deleteMany({ $or: [{ userId: user._id }, { employerId: user._id }] });

    // Delete the user
    await User.findByIdAndDelete(user._id);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

/**
 * POST /api/admin/recover-gold
 * Audit and recover lost gold from completed jobs (admin only)
 * Finds all completed jobs and released payments, calculates expected gold,
 * and recovers any missing gold for students
 */
router.post("/recover-gold", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const report = {
      studentsAudited: 0,
      studentsWithMissingGold: 0,
      totalGoldRecovered: 0,
      totalTasksRecovered: 0,
      details: [] as Array<{
        studentId: string;
        studentName: string;
        studentEmail: string;
        expectedGold: number;
        actualGold: number;
        missingGold: number;
        expectedTasks: number;
        actualTasks: number;
        missingTasks: number;
        recoveredGold: number;
        recoveredTasks: number;
        jobs: Array<{ jobId: string; jobTitle: string; gold: number }>;
      }>,
    };

    // Find all completed jobs (confirmed submissions)
    const completedJobs = await Internship.find({
      status: "completed",
      submissionStatus: "confirmed",
      acceptedStudentId: { $exists: true, $ne: null },
      gold: { $exists: true, $gt: 0 },
    }).populate("acceptedStudentId", "name email gold totalTasksCompleted");

    // Find all released payments
    const releasedPayments = await Payment.find({
      status: "released",
    }).populate("taskId").populate("studentId", "name email gold totalTasksCompleted");

    // Group jobs by student
    const studentJobMap = new Map<string, Array<{ job: any; gold: number }>>();
    
    // Process completed jobs
    for (const job of completedJobs) {
      const studentId = job.acceptedStudentId?._id?.toString();
      if (!studentId) continue;

      if (!studentJobMap.has(studentId)) {
        studentJobMap.set(studentId, []);
      }
      studentJobMap.get(studentId)!.push({ job, gold: job.gold || 0 });
    }

    // Process released payments (in case some jobs don't have confirmed status but payment was released)
    for (const payment of releasedPayments) {
      const studentId = payment.studentId?._id?.toString();
      const taskId = payment.taskId?._id?.toString();
      if (!studentId || !taskId) continue;

      // Check if this job is already counted
      const alreadyCounted = Array.from(studentJobMap.values())
        .flat()
        .some((item) => item.job._id.toString() === taskId);

      if (!alreadyCounted) {
        const task = payment.taskId as any;
        if (task && task.status === "completed") {
          if (!studentJobMap.has(studentId)) {
            studentJobMap.set(studentId, []);
          }
          studentJobMap.get(studentId)!.push({ 
            job: task, 
            gold: payment.amount || 0 
          });
        }
      }
    }

    // Audit each student
    for (const [studentId, jobs] of studentJobMap.entries()) {
      const student = await User.findById(studentId);
      if (!student || student.role !== "student") continue;

      report.studentsAudited++;

      // Calculate expected gold and tasks
      const expectedGold = jobs.reduce((sum, item) => sum + item.gold, 0);
      const expectedTasks = jobs.length;
      const actualGold = student.gold || 0;
      const actualTasks = student.totalTasksCompleted || 0;

      const missingGold = Math.max(0, expectedGold - actualGold);
      const missingTasks = Math.max(0, expectedTasks - actualTasks);

      if (missingGold > 0 || missingTasks > 0) {
        report.studentsWithMissingGold++;

        // Recover missing gold and tasks using atomic update
        if (missingGold > 0 || missingTasks > 0) {
          const updatedStudent = await User.findByIdAndUpdate(
            studentId,
            {
              $inc: { 
                gold: missingGold,
                totalTasksCompleted: missingTasks,
              },
            },
            { new: true }
          );

          if (updatedStudent) {
            // Recalculate average completion time and star rating
            let newAvgCompletionTime = updatedStudent.averageCompletionTime || 0;
            if (jobs.length > 0 && updatedStudent.totalTasksCompleted > 0) {
              // Calculate average from completed jobs
              let totalDays = 0;
              let validJobs = 0;
              for (const item of jobs) {
                const job = item.job;
                if (job.acceptedAt && job.completedAt) {
                  const days = (job.completedAt.getTime() - job.acceptedAt.getTime()) / (1000 * 60 * 60 * 24);
                  totalDays += days;
                  validJobs++;
                }
              }
              if (validJobs > 0) {
                newAvgCompletionTime = Math.round((totalDays / validJobs) * 10) / 10;
              }
            }

            updatedStudent.averageCompletionTime = newAvgCompletionTime;
            updatedStudent.starRating = calculateStarRating(
              updatedStudent.totalTasksCompleted,
              updatedStudent.averageCompletionTime
            );
            await updatedStudent.save();

            report.totalGoldRecovered += missingGold;
            report.totalTasksRecovered += missingTasks;

            report.details.push({
              studentId: studentId,
              studentName: student.name,
              studentEmail: student.email,
              expectedGold,
              actualGold,
              missingGold,
              expectedTasks,
              actualTasks,
              missingTasks,
              recoveredGold: missingGold,
              recoveredTasks: missingTasks,
              jobs: jobs.map((item) => ({
                jobId: item.job._id.toString(),
                jobTitle: item.job.title || "Unknown",
                gold: item.gold,
              })),
            });

            console.log(`[Gold Recovery] Student ${studentId} (${student.email}): Recovered ${missingGold} gold and ${missingTasks} tasks. New balance: ${updatedStudent.gold}, Completed: ${updatedStudent.totalTasksCompleted}`);
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Gold recovery completed. Recovered ${report.totalGoldRecovered} gold and ${report.totalTasksRecovered} tasks for ${report.studentsWithMissingGold} student(s).`,
      report,
    });
  } catch (err) {
    console.error("Gold recovery error:", err);
    res.status(500).json({ 
      success: false, 
      message: `Failed to recover gold: ${err instanceof Error ? err.message : "Unknown error"}` 
    });
  }
});

/**
 * GET /api/admin/payments/escrowed
 * Get all escrowed payments for completed jobs (admin only)
 */
router.get("/payments/escrowed", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const escrowedPayments = await Payment.find({
      status: "escrowed",
    })
      .populate("taskId", "title companyName status completedAt submissionStatus")
      .populate("studentId", "name email")
      .populate("employerId", "name email companyName")
      .sort({ escrowedAt: -1 });

    // Filter to only show payments for completed jobs
    const completedEscrowedPayments = escrowedPayments.filter((payment: any) => {
      const task = payment.taskId;
      return task && task.status === "completed";
    });

    res.json({
      success: true,
      data: completedEscrowedPayments,
      count: completedEscrowedPayments.length,
    });
  } catch (err) {
    console.error("Error fetching escrowed payments:", err);
    res.status(500).json({
      success: false,
      message: `Failed to fetch escrowed payments: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
});

/**
 * POST /api/admin/payments/release/:paymentId
 * Admin releases escrowed payment to student (admin only)
 */
router.post("/payments/release/:paymentId", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const payment = await Payment.findById(req.params.paymentId).populate("taskId");
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status !== "escrowed") {
      return res.status(400).json({
        success: false,
        message: `Payment must be escrowed to release. Current status: ${payment.status}`,
      });
    }

    const task = payment.taskId as any;
    if (!task || task.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Task must be completed to release payment",
      });
    }

    // Update payment status
    payment.status = "released";
    payment.releasedAt = new Date();
    payment.releasedBy = req.user.id;
    await payment.save();

    // Award gold to student, update completion time
    if (task.acceptedAt && task.completedAt) {
      const goldEarned = payment.amount;

      // Calculate completion time for this task
      const completionDays = (task.completedAt.getTime() - task.acceptedAt.getTime()) / (1000 * 60 * 60 * 24);

      // Use atomic update for gold
      const updatedStudent = await User.findByIdAndUpdate(
        payment.studentId,
        {
          $inc: { gold: goldEarned, totalTasksCompleted: 1 },
        },
        { new: true }
      );

      if (!updatedStudent) {
        console.error(`[Admin Payment Release] Failed to update student ${payment.studentId}`);
        return res.status(500).json({ success: false, message: "Failed to update student gold" });
      }

      // Calculate new average completion time
      const currentAvg = updatedStudent.averageCompletionTime || 0;
      const completedCount = updatedStudent.totalTasksCompleted || 0;
      const newAvg = completedCount > 1
        ? ((currentAvg * (completedCount - 1)) + completionDays) / completedCount
        : completionDays;

      // Update star rating based on performance
      updatedStudent.averageCompletionTime = Math.round(newAvg * 10) / 10;
      updatedStudent.starRating = calculateStarRating(
        updatedStudent.totalTasksCompleted,
        updatedStudent.averageCompletionTime
      );

      await updatedStudent.save();

      console.log(`[Admin Payment Release] Student ${payment.studentId} received ${goldEarned} gold. New balance: ${updatedStudent.gold}, Completed tasks: ${updatedStudent.totalTasksCompleted}`);

      await createNotification(
        updatedStudent._id.toString(),
        "payment_received",
        "Payment Released by Admin",
        `Admin released ${goldEarned} gold for completing "${task.title}"`,
        task._id.toString(),
        req.user.id,
        { goldEarned, refreshUser: true }
      );
    }

    res.json({
      success: true,
      data: payment,
      studentId: payment.studentId.toString(),
      goldAwarded: payment.amount,
    });
  } catch (err) {
    console.error("Error releasing payment:", err);
    res.status(500).json({
      success: false,
      message: `Failed to release payment: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
});

export default router;

