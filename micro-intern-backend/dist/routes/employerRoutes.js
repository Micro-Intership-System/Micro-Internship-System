"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_1 = require("../models/user");
const internship_1 = require("../models/internship");
const requireAuth_1 = require("../middleware/requireAuth");
const application_1 = require("../models/application");
const anomaly_1 = require("../models/anomaly");
const notifications_1 = require("../utils/notifications");
const router = (0, express_1.Router)();
/**
 * Middleware: require employer role
 */
async function requireEmployer(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await user_1.User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        // Check if JWT token says employer but database doesn't match - auto-fix it
        if (req.user.role === "employer" && user.role !== "employer") {
            console.warn(`Role mismatch for user ${user.email}: JWT says "employer" but DB has "${user.role}". Auto-fixing...`);
            user.role = "employer";
            await user.save();
        }
        // Final check - must be employer in database
        if (user.role !== "employer") {
            return res.status(403).json({
                success: false,
                message: "Access denied — employer account required",
            });
        }
        req.employer = user;
        next();
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}
/**
 * GET /api/employer/me
 * Fetch employer profile (from User collection)
 */
router.get("/me", requireAuth_1.requireAuth, requireEmployer, async (req, res) => {
    const employer = req.employer;
    // Get review stats
    const { TaskReview } = await Promise.resolve().then(() => __importStar(require("../models/taskReview")));
    const reviews = await TaskReview.find({
        reviewedId: employer._id,
        reviewType: "student_to_employer",
        isVisible: true,
    });
    const averageRating = reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.starRating, 0) / reviews.length) * 10) / 10
        : 0;
    // Get completed jobs count
    const completedJobsCount = await internship_1.Internship.countDocuments({
        employerId: employer._id,
        status: "completed",
    });
    res.json({
        success: true,
        data: {
            id: employer._id,
            name: employer.name,
            email: employer.email,
            companyName: employer.companyName,
            companyWebsite: employer.companyWebsite,
            companyDescription: employer.companyDescription,
            companyLogo: employer.companyLogo,
            averageRating,
            totalReviews: reviews.length,
            completedJobsCount,
            createdAt: employer.createdAt,
            updatedAt: employer.updatedAt,
            restrictionUntil: employer.restrictionUntil,
            canOnlyPostLowPriority: employer.canOnlyPostLowPriority,
        },
    });
});
/**
 * PUT /api/employer/me
 * Update employer profile fields
 */
router.put("/me", requireAuth_1.requireAuth, requireEmployer, async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "companyName",
            "companyWebsite",
            "companyDescription",
            "companyLogo",
        ];
        const updates = {};
        const oldCompanyName = req.employer.companyName;
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }
        // Track company name changes - if changed more than once, create anomaly
        if (updates.companyName && updates.companyName !== oldCompanyName && oldCompanyName) {
            // Count previous company name changes (check existing anomalies)
            const existingAnomalies = await anomaly_1.Anomaly.countDocuments({
                type: "company_name_change",
                employerId: req.employer._id,
                status: { $in: ["open", "investigating"] },
            });
            // If this is the second or more change, create anomaly
            if (existingAnomalies >= 1) {
                await anomaly_1.Anomaly.create({
                    type: "company_name_change",
                    severity: "medium",
                    employerId: req.employer._id,
                    userId: req.employer._id,
                    description: `Employer "${req.employer.name}" (${req.employer.email}) has changed company name multiple times. Previous: "${oldCompanyName}", New: "${updates.companyName}"`,
                    detectedAt: new Date(),
                });
            }
        }
        const updated = await user_1.User.findByIdAndUpdate(req.employer._id, updates, { new: true });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: "Invalid update data" });
    }
});
/**
 * POST /api/employer/me/logo
 * Upload or update employer logo (URL only)
 */
router.post("/me/logo", requireAuth_1.requireAuth, requireEmployer, async (req, res) => {
    try {
        if (!req.body.companyLogo) {
            return res.status(400).json({ success: false, message: "Logo URL required" });
        }
        const updated = await user_1.User.findByIdAndUpdate(req.employer._id, { companyLogo: req.body.companyLogo }, { new: true });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});
/**
 * POST /api/employer/me/about
 * Update description only
 */
router.post("/me/about", requireAuth_1.requireAuth, requireEmployer, async (req, res) => {
    try {
        const updated = await user_1.User.findByIdAndUpdate(req.employer._id, { companyDescription: req.body.companyDescription }, { new: true });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: "Invalid description" });
    }
});
/**
 * GET /api/employer/jobs
 * Get all jobs posted by the employer
 */
router.get("/jobs", requireAuth_1.requireAuth, requireEmployer, async (req, res) => {
    try {
        const jobs = await internship_1.Internship.find({ employerId: req.user.id }).lean();
        const jobIds = jobs.map(j => j._id);
        const counts = await application_1.Application.aggregate([
            { $match: { internshipId: { $in: jobIds } } },
            { $group: { _id: "$internshipId", count: { $sum: 1 } } },
        ]);
        const countMap = Object.fromEntries(counts.map(c => [String(c._id), c.count]));
        const enriched = jobs.map(j => ({
            ...j,
            applicantsCount: countMap[String(j._id)] || 0,
        }));
        res.json({ success: true, data: enriched });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load jobs" });
    }
});
/**
 * GET /api/employer/applications
 * Employer views applications across all their jobs
 */
router.get("/applications", requireAuth_1.requireAuth, requireEmployer, async (req, res) => {
    try {
        // Find all job ids for this employer
        const jobs = await internship_1.Internship.find({ employerId: req.user.id }).select("_id").lean();
        const jobIds = jobs.map((j) => j._id);
        const apps = await application_1.Application.find({ internshipId: { $in: jobIds } })
            .populate("studentId", "name email institution skills bio profilePicture portfolio")
            .populate("internshipId", "title")
            .sort({ createdAt: -1 });
        res.json({ success: true, data: apps });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load applications" });
    }
});
/**
 * GET /api/employer/jobs/:jobId/applications
 * Employer views applications for a job
 */
router.get("/jobs/:jobId/applications", requireAuth_1.requireAuth, requireEmployer, async (req, res) => {
    try {
        const { jobId } = req.params;
        const apps = await application_1.Application.find({ internshipId: jobId })
            .populate("studentId", "name email institution skills bio profilePicture portfolio")
            .sort({ createdAt: -1 });
        res.json({ success: true, data: apps });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to load applications",
        });
    }
});
/**
 * GET /api/employer/all
 * Get all employers (admin only)
 */
router.get("/all", requireAuth_1.requireAuth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await user_1.User.findById(req.user.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const employers = await user_1.User.find({ role: "employer" })
            .select("name email companyName companyWebsite companyDescription companyLogo profilePicture verificationStatus gold createdAt")
            .sort({ createdAt: -1 });
        // Get review stats
        const { TaskReview } = await Promise.resolve().then(() => __importStar(require("../models/taskReview")));
        // Enrich with job counts and review stats
        const enriched = await Promise.all(employers.map(async (employer) => {
            const jobCount = await internship_1.Internship.countDocuments({ employerId: employer._id });
            // Get review statistics
            const reviews = await TaskReview.find({
                reviewedId: employer._id,
                reviewType: "student_to_employer",
                isVisible: true,
            });
            const averageRating = reviews.length > 0
                ? Math.round((reviews.reduce((sum, r) => sum + r.starRating, 0) / reviews.length) * 10) / 10
                : 0;
            // Get payment count
            const paymentCount = await internship_1.Internship.countDocuments({
                employerId: employer._id,
                status: "completed",
                submissionStatus: "confirmed",
            });
            return {
                ...employer.toObject(),
                totalTasksPosted: jobCount,
                totalPaymentsMade: paymentCount,
                averageRating,
                totalReviews: reviews.length,
            };
        }));
        res.json({ success: true, data: enriched });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load employers" });
    }
});
/**
 * GET /api/employer/:employerId
 * Get a specific employer by ID (admin only)
 */
router.get("/:employerId", requireAuth_1.requireAuth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await user_1.User.findById(req.user.id);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin access required" });
        }
        const employer = await user_1.User.findById(req.params.employerId);
        if (!employer || employer.role !== "employer") {
            return res.status(404).json({ success: false, message: "Employer not found" });
        }
        res.json({
            success: true,
            data: {
                _id: employer._id,
                name: employer.name,
                email: employer.email,
                companyName: employer.companyName,
                profilePicture: employer.profilePicture,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load employer" });
    }
});
/**
 * PATCH /api/employer/applications/:appId/status
 * Accept or reject an application
 */
router.patch("/applications/:appId/status", requireAuth_1.requireAuth, requireEmployer, async (req, res) => {
    try {
        const { appId } = req.params;
        const { status } = req.body;
        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }
        const application = await application_1.Application.findById(appId).populate("internshipId");
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }
        const task = application.internshipId;
        if (task.employerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not your job",
            });
        }
        if (status === "accepted") {
            // Check if task is available for acceptance
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
            // Notify student
            await (0, notifications_1.createNotification)(application.studentId.toString(), "application_accepted", "Application Accepted!", `Your application for "${task.title}" has been accepted!`, String(task._id), req.user.id);
        }
        else {
            // Reject application
            const { rejectionReason } = req.body;
            application.status = "rejected";
            if (rejectionReason && rejectionReason.trim().length > 0) {
                application.rejectionReason = rejectionReason.trim();
            }
            await application.save();
            // Notify student
            const notificationMessage = rejectionReason && rejectionReason.trim().length > 0
                ? `Your application for "${task.title}" was not selected. Reason: ${rejectionReason.trim()}`
                : `Your application for "${task.title}" was not selected.`;
            await (0, notifications_1.createNotification)(application.studentId.toString(), "application_rejected", "Application Update", notificationMessage, String(task._id), req.user.id);
        }
        res.json({ success: true, data: application });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Failed to update status",
        });
    }
});
exports.default = router;
