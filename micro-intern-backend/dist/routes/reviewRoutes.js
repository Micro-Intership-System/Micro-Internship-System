"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const taskReview_1 = require("../models/taskReview");
const internship_1 = require("../models/internship");
const user_1 = require("../models/user");
const notifications_1 = require("../utils/notifications");
const reviews_1 = require("../utils/reviews");
const router = (0, express_1.Router)();
/**
 * POST /api/reviews
 * Submit a review (employer reviews student or vice versa)
 */
router.post("/", requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { taskId, starRating, comment } = req.body;
        if (!taskId || !starRating) {
            return res.status(400).json({
                success: false,
                message: "taskId and starRating are required",
            });
        }
        if (starRating < 1 || starRating > 5) {
            return res.status(400).json({
                success: false,
                message: "starRating must be between 1 and 5",
            });
        }
        const task = await internship_1.Internship.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }
        if (task.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "Can only review completed tasks",
            });
        }
        const reviewer = await user_1.User.findById(req.user.id);
        if (!reviewer) {
            return res.status(404).json({ success: false, message: "Reviewer not found" });
        }
        // Determine review type and who is being reviewed
        let reviewedId;
        let reviewType;
        if (reviewer.role === "employer") {
            if (String(task.employerId) !== String(reviewer._id)) {
                return res.status(403).json({
                    success: false,
                    message: "You can only review students for your own tasks",
                });
            }
            reviewedId = task.acceptedStudentId?.toString() || "";
            reviewType = "employer_to_student";
        }
        else if (reviewer.role === "student") {
            if (String(task.acceptedStudentId) !== String(reviewer._id)) {
                return res.status(403).json({
                    success: false,
                    message: "You can only review employers for tasks you completed",
                });
            }
            reviewedId = task.employerId.toString();
            reviewType = "student_to_employer";
        }
        else {
            return res.status(403).json({
                success: false,
                message: "Only employers and students can submit reviews",
            });
        }
        if (!reviewedId) {
            return res.status(400).json({
                success: false,
                message: "No one to review for this task",
            });
        }
        // Check if review already exists
        const existing = await taskReview_1.TaskReview.findOne({
            taskId: task._id,
            reviewerId: reviewer._id,
            reviewedId,
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this task",
            });
        }
        // Create review
        const review = await taskReview_1.TaskReview.create({
            taskId: task._id,
            reviewerId: reviewer._id,
            reviewerRole: reviewer.role,
            reviewedId,
            starRating,
            comment: comment || "",
            reviewType,
        });
        // If employer reviewed student, update student's star rating
        if (reviewType === "employer_to_student") {
            await (0, reviews_1.updateStudentStarRating)(reviewedId);
            // Notify student
            await (0, notifications_1.createNotification)(reviewedId, "review_received", "New Review Received", `You received a ${starRating}-star review from ${reviewer.companyName || reviewer.name}`, String(task._id), String(reviewer._id), { starRating });
        }
        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: review,
        });
    }
    catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this task",
            });
        }
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to submit review" });
    }
});
/**
 * GET /api/reviews/task/:taskId
 * Get all reviews for a specific task
 */
router.get("/task/:taskId", async (req, res) => {
    try {
        const reviews = await taskReview_1.TaskReview.find({
            taskId: req.params.taskId,
            isVisible: true,
        })
            .populate("reviewerId", "name email companyName profilePicture")
            .populate("reviewedId", "name email companyName profilePicture")
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load reviews" });
    }
});
/**
 * GET /api/reviews/student/:studentId
 * Get all reviews for a specific student
 */
router.get("/student/:studentId", async (req, res) => {
    try {
        const reviews = await taskReview_1.TaskReview.find({
            reviewedId: req.params.studentId,
            reviewType: "employer_to_student",
            isVisible: true,
        })
            .populate("reviewerId", "name email companyName")
            .populate("taskId", "title")
            .sort({ createdAt: -1 });
        // Calculate average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.starRating, 0) / reviews.length
            : 0;
        res.json({
            success: true,
            data: reviews,
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: reviews.length,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load reviews" });
    }
});
/**
 * GET /api/reviews/employer/:employerId
 * Get all reviews for a specific employer
 */
router.get("/employer/:employerId", async (req, res) => {
    try {
        const reviews = await taskReview_1.TaskReview.find({
            reviewedId: req.params.employerId,
            reviewType: "student_to_employer",
            isVisible: true,
        })
            .populate("reviewerId", "name email profilePicture")
            .populate("taskId", "title")
            .sort({ createdAt: -1 });
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.starRating, 0) / reviews.length
            : 0;
        res.json({
            success: true,
            data: reviews,
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: reviews.length,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load reviews" });
    }
});
exports.default = router;
