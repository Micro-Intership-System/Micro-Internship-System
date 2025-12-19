import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { Payment } from "../models/payment";
import { Internship } from "../models/internship";
import { User } from "../models/user";
import { createNotification } from "../utils/notifications";
import { calculateTaskGold, calculateStarRating } from "../utils/gamification";

const router = Router();

/**
 * POST /api/payments/escrow
 * Employer funds escrow for a task
 */
router.post("/escrow", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "employer") {
      return res.status(403).json({ success: false, message: "Employers only" });
    }

    const { taskId } = req.body;
    const task = await Internship.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.employerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not your task" });
    }

    if (task.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Task must be in progress to fund escrow",
      });
    }

    // Check if payment already exists
    const existing = await Payment.findOne({ taskId: task._id });
    if (existing && existing.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Payment already processed",
      });
    }

    const payment = existing || await Payment.create({
      taskId: task._id,
      employerId: task.employerId,
      studentId: task.acceptedStudentId!,
      amount: task.gold, // Use gold instead of budget
      status: "escrowed",
      escrowedAt: new Date(),
    });

    if (!existing) {
      await createNotification(
        task.acceptedStudentId!.toString(),
        "payment_released",
        "Payment Escrowed",
        `Payment escrowed for task "${task.title}" - you will receive ${task.gold} gold upon completion`,
        task._id.toString(),
        task.employerId.toString()
      );
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fund escrow" });
  }
});

/**
 * POST /api/payments/release/:paymentId
 * Employer releases payment to student
 */
router.post("/release/:paymentId", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "employer") {
      return res.status(403).json({ success: false, message: "Employers only" });
    }

    const payment = await Payment.findById(req.params.paymentId).populate("taskId");
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.employerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not your payment" });
    }

    if (payment.status !== "escrowed") {
      return res.status(400).json({
        success: false,
        message: "Payment must be escrowed to release",
      });
    }

    const task = payment.taskId as any;
    if (task.status !== "completed") {
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
    // Use atomic update to prevent race conditions
    if (task.acceptedAt && task.completedAt) {
      const goldEarned = payment.amount; // Payment amount is already in gold units
      
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
        console.error(`[Payment Release] Failed to update student ${payment.studentId}`);
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

      console.log(`[Payment Release] Student ${payment.studentId} received ${goldEarned} gold. New balance: ${updatedStudent.gold}, Completed tasks: ${updatedStudent.totalTasksCompleted}`);

      await createNotification(
        updatedStudent._id.toString(),
        "payment_received",
        "Payment Received",
        `You received ${goldEarned} gold for completing "${task.title}"`,
        task._id.toString(),
        payment.employerId.toString(),
        { goldEarned, refreshUser: true }
      );
    }

    res.json({ 
      success: true, 
      data: payment,
      studentId: payment.studentId.toString(),
      goldAwarded: payment.amount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to release payment" });
  }
});

/**
 * GET /api/payments/task/:taskId
 * Get payment info for a task
 */
router.get("/task/:taskId", requireAuth, async (req: any, res) => {
  try {
    const payment = await Payment.findOne({ taskId: req.params.taskId })
      .populate("employerId", "name email")
      .populate("studentId", "name email");

    if (!payment) {
      return res.json({ success: true, data: null });
    }

    // Check access
    const isEmployer = req.user?.role === "employer" && payment.employerId.toString() === req.user.id;
    const isStudent = req.user?.role === "student" && payment.studentId.toString() === req.user.id;
    const isAdmin = req.user?.role === "admin";

    if (!isEmployer && !isStudent && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load payment" });
  }
});

/**
 * GET /api/payments/student/me
 * Get all payments for the current student
 */
router.get("/student/me", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const payments = await Payment.find({ studentId: req.user.id })
      .populate("taskId", "title companyName status completedAt")
      .populate("employerId", "name email companyName")
      .sort({ releasedAt: -1, escrowedAt: -1, createdAt: -1 });

    res.json({ success: true, data: payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load payments" });
  }
});

export default router;

