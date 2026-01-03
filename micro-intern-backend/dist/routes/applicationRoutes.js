"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const application_1 = require("../models/application");
const internship_1 = require("../models/internship");
const user_1 = require("../models/user");
const notifications_1 = require("../utils/notifications");
const emailService_1 = require("../utils/emailService");
const emailTemplates_1 = require("../utils/emailTemplates");
const router = (0, express_1.Router)();
/**
 * POST /api/applications
 * Student applies to a job
 */
router.post("/", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "student") {
            return res.status(403).json({ success: false, message: "Students only" });
        }
        const { internshipId } = req.body;
        if (!internshipId) {
            return res.status(400).json({ success: false, message: "internshipId required" });
        }
        const job = await internship_1.Internship.findById(internshipId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        // prevent duplicate apply
        const existing = await application_1.Application.findOne({
            internshipId,
            studentId: req.user.id,
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Already applied",
            });
        }
        const app = await application_1.Application.create({
            internshipId,
            employerId: job.employerId,
            studentId: req.user.id,
            status: "applied",
        });
        // Get employer and student details for email
        const employer = await user_1.User.findById(job.employerId);
        const student = await user_1.User.findById(req.user.id);
        // Notify employer
        await (0, notifications_1.createNotification)(job.employerId.toString(), "application_received", "New Application", `You received a new application for "${job.title}"`, String(job._id), req.user.id);
        // Send email to employer
        if (employer && student) {
            try {
                await (0, emailService_1.sendEmail)(employer.email, (0, emailTemplates_1.jobApplicationReceivedEmail)(employer.name, student.name, job.title, String(app._id)));
            }
            catch (emailError) {
                console.error("Failed to send application email to employer:", emailError);
                // Don't fail the request if email fails
            }
        }
        res.status(201).json({ success: true, data: app });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to apply" });
    }
});
/**
 * GET /api/applications/me
 * Get applications of logged-in student
 */
router.get("/me", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "student") {
            return res.status(403).json({ success: false, message: "Students only" });
        }
        const apps = await application_1.Application.find({ studentId: req.user.id })
            .populate("internshipId", "title companyName")
            .sort({ createdAt: -1 });
        res.json({ success: true, data: apps });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load applications" });
    }
});
/**
 * PATCH /api/applications/:id/accept
 * Employer accepts an application
 */
router.patch("/:id/accept", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "employer") {
            return res.status(403).json({ success: false, message: "Employers only" });
        }
        const application = await application_1.Application.findById(req.params.id).populate("internshipId");
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        const task = application.internshipId;
        if (task.employerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not your task" });
        }
        if (task.status !== "posted") {
            return res.status(400).json({
                success: false,
                message: "Task is not available for acceptance",
            });
        }
        // Reject all other applications
        await application_1.Application.updateMany({
            internshipId: task._id,
            _id: { $ne: application._id },
            status: { $in: ["applied", "evaluating"] },
        }, { status: "rejected" });
        // Accept this application
        application.status = "accepted";
        await application.save();
        // Update task
        task.status = "in_progress";
        task.acceptedStudentId = application.studentId;
        task.acceptedAt = new Date();
        await task.save();
        // Get student and employer details for email
        const student = await user_1.User.findById(application.studentId);
        const employer = await user_1.User.findById(req.user.id);
        // Notify student
        await (0, notifications_1.createNotification)(application.studentId.toString(), "application_accepted", "Application Accepted!", `Your application for "${task.title}" has been accepted!`, String(task._id), req.user.id);
        // Send email to student
        if (student && employer) {
            try {
                await (0, emailService_1.sendEmail)(student.email, (0, emailTemplates_1.applicationAcceptedEmail)(student.name, task.title, employer.companyName || employer.name, task._id.toString()));
            }
            catch (emailError) {
                console.error("Failed to send acceptance email to student:", emailError);
                // Don't fail the request if email fails
            }
        }
        res.json({ success: true, data: application });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to accept application" });
    }
});
/**
 * PATCH /api/applications/:id/reject
 * Employer rejects an application
 */
router.patch("/:id/reject", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "employer") {
            return res.status(403).json({ success: false, message: "Employers only" });
        }
        const application = await application_1.Application.findById(req.params.id).populate("internshipId");
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        const task = application.internshipId;
        if (task.employerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not your task" });
        }
        application.status = "rejected";
        await application.save();
        // Notify student
        await (0, notifications_1.createNotification)(application.studentId.toString(), "application_rejected", "Application Update", `Your application for "${task.title}" was not selected.`, String(task._id), req.user.id);
        res.json({ success: true, data: application });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to reject application" });
    }
});
/**
 * POST /api/applications/task/:taskId/complete
 * Student or employer marks task as completed
 */
router.post("/task/:taskId/complete", requireAuth_1.requireAuth, async (req, res) => {
    try {
        const task = await internship_1.Internship.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        const isStudent = req.user?.role === "student" && task.acceptedStudentId?.toString() === req.user.id;
        const isEmployer = req.user?.role === "employer" && task.employerId.toString() === req.user.id;
        if (!isStudent && !isEmployer) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        if (task.status !== "in_progress") {
            return res.status(400).json({
                success: false,
                message: "Task is not in progress",
            });
        }
        task.status = "completed";
        task.completedAt = new Date();
        await task.save();
        // Notify the other party
        if (isStudent) {
            await (0, notifications_1.createNotification)(task.employerId.toString(), "task_completed", "Task Completed", `Task "${task.title}" has been marked as completed by the student`, String(task._id), req.user.id);
        }
        else {
            await (0, notifications_1.createNotification)(task.acceptedStudentId.toString(), "task_completed", "Task Completed", `Your task "${task.title}" has been marked as completed by the employer`, String(task._id), req.user.id);
        }
        res.json({ success: true, data: task });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to complete task" });
    }
});
exports.default = router;
