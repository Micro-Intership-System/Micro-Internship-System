"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const payment_1 = require("../models/payment");
const internship_1 = require("../models/internship");
const user_1 = require("../models/user");
const notifications_1 = require("../utils/notifications");
const gamification_1 = require("../utils/gamification");
const emailService_1 = require("../utils/emailService");
const emailTemplates_1 = require("../utils/emailTemplates");
const router = (0, express_1.Router)();
/**
 * POST /api/payments/escrow
 * Employer funds escrow for a task
 */
router.post("/escrow", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "employer") {
            return res.status(403).json({ success: false, message: "Employers only" });
        }
        const { taskId } = req.body;
        const task = await internship_1.Internship.findById(taskId);
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
        const existing = await payment_1.Payment.findOne({ taskId: task._id });
        if (existing && existing.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Payment already processed",
            });
        }
        const payment = existing || await payment_1.Payment.create({
            taskId: task._id,
            employerId: task.employerId,
            studentId: task.acceptedStudentId,
            amount: task.gold, // Use gold instead of budget
            status: "escrowed",
            escrowedAt: new Date(),
        });
        if (!existing) {
            await (0, notifications_1.createNotification)(task.acceptedStudentId.toString(), "payment_released", "Payment Escrowed", `Payment of ${task.gold} Gold has been escrowed for task "${task.title}"`, String(task._id), task.employerId.toString());
        }
        res.json({ success: true, data: payment });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fund escrow" });
    }
});
/**
 * POST /api/payments/release/:paymentId
 * Employer releases payment to student
 */
router.post("/release/:paymentId", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "employer") {
            return res.status(403).json({ success: false, message: "Employers only" });
        }
        const payment = await payment_1.Payment.findById(req.params.paymentId).populate("taskId");
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
        const task = payment.taskId;
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
        // Award gold and XP to student, update completion time
        const student = await user_1.User.findById(payment.studentId);
        if (student && task.acceptedAt && task.completedAt) {
            const goldEarned = (0, gamification_1.calculateTaskGold)(payment.amount);
            const xpEarned = (0, gamification_1.calculateTaskXP)(payment.amount, task.priorityLevel);
            // Calculate completion time for this task
            const completionDays = (task.completedAt.getTime() - task.acceptedAt.getTime()) / (1000 * 60 * 60 * 24);
            const currentAvg = student.averageCompletionTime || 0;
            const completedCount = student.totalTasksCompleted || 0;
            // Update average completion time
            const newAvg = completedCount > 0
                ? ((currentAvg * completedCount) + completionDays) / (completedCount + 1)
                : completionDays;
            student.gold = (student.gold || 0) + goldEarned;
            student.xp = (student.xp || 0) + xpEarned;
            student.totalTasksCompleted = (student.totalTasksCompleted || 0) + 1;
            student.averageCompletionTime = Math.round(newAvg * 10) / 10; // Round to 1 decimal
            // Update star rating based on performance
            student.starRating = (0, gamification_1.calculateStarRating)(student.xp, student.totalTasksCompleted, student.averageCompletionTime);
            await student.save();
            await (0, notifications_1.createNotification)(String(student._id), "payment_received", "Payment Received", `You received ${payment.amount} Gold, ${goldEarned} gold bonus, and ${xpEarned} XP for completing "${task.title}"`, String(task._id), payment.employerId.toString(), { goldEarned, xpEarned });
            // Send email to student
            const employer = await user_1.User.findById(payment.employerId);
            if (employer) {
                try {
                    await (0, emailService_1.sendEmail)(student.email, (0, emailTemplates_1.paymentReleasedEmail)(student.name, payment.amount, task.title, employer.companyName || employer.name));
                }
                catch (emailError) {
                    console.error("Failed to send payment email to student:", emailError);
                    // Don't fail the request if email fails
                }
            }
        }
        res.json({ success: true, data: payment });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to release payment" });
    }
});
/**
 * GET /api/payments/task/:taskId
 * Get payment info for a task
 */
router.get("/task/:taskId", requireAuth_1.requireAuth, async (req, res) => {
    try {
        const payment = await payment_1.Payment.findOne({ taskId: req.params.taskId })
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load payment" });
    }
});
/**
 * GET /api/payments/student/:studentId
 * Get all successful payments for a student
 */
router.get("/student/:studentId", requireAuth_1.requireAuth, async (req, res) => {
    try {
        // Check access - student can only see their own, admin can see all
        const isStudent = req.user?.role === "student" && req.params.studentId === req.user.id;
        const isAdmin = req.user?.role === "admin";
        if (!isStudent && !isAdmin) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        const payments = await payment_1.Payment.find({
            studentId: req.params.studentId,
            status: "released", // Only successful payments
        })
            .populate("employerId", "name email companyName")
            .populate("studentId", "name email")
            .populate("taskId", "title")
            .sort({ releasedAt: -1 }) // Most recent first
            .lean();
        res.json({ success: true, data: payments });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load payments" });
    }
});
/**
 * GET /api/payments/all
 * Get all payments (admin only)
 */
router.get("/all", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin only" });
        }
        const payments = await payment_1.Payment.find({})
            .populate("employerId", "name email companyName")
            .populate("studentId", "name email")
            .populate("taskId", "title")
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, data: payments });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load payments" });
    }
});
exports.default = router;
