"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const multer_1 = __importDefault(require("multer"));
const storage_1 = require("../utils/storage");
const supabase_1 = require("../config/supabase");
const internship_1 = require("../models/internship");
const router = (0, express_1.Router)();
// Configure multer for memory storage (we'll upload to Supabase)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
/**
 * POST /api/upload/profile-picture
 * Upload profile picture
 */
router.post("/profile-picture", requireAuth_1.requireAuth, upload.single("file"), async (req, res) => {
    try {
        // Debug logging
        console.log("Upload request received:", {
            hasUser: !!req.user,
            userId: req.user?.id,
            hasFile: !!req.file,
            contentType: req.headers["content-type"],
            authHeader: req.headers.authorization ? "present" : "missing",
        });
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file provided" });
        }
        const file = req.file;
        const filename = `${req.user.id}-${Date.now()}.${file.originalname.split(".").pop()}`;
        const result = await (0, storage_1.uploadImage)(file.buffer, "profile-pictures", filename);
        if (!result.success || !result.url) {
            console.error("Upload failed:", {
                success: result.success,
                error: result.error,
                hasUrl: !!result.url,
            });
            return res.status(500).json({
                success: false,
                message: result.error || "Failed to upload file",
                details: result.error,
            });
        }
        console.log("Upload successful:", {
            url: result.url,
            path: result.path,
        });
        res.json({
            success: true,
            data: {
                url: result.url,
                path: result.path,
            },
        });
    }
    catch (err) {
        console.error("Profile picture upload error:", {
            message: err.message,
            stack: err.stack,
            name: err.name,
        });
        res.status(500).json({
            success: false,
            message: err.message || "Failed to upload profile picture",
            error: err.message,
        });
    }
});
/**
 * POST /api/upload/company-logo
 * Upload company logo (employer only)
 */
router.post("/company-logo", requireAuth_1.requireAuth, upload.single("file"), async (req, res) => {
    try {
        if (req.user?.role !== "employer") {
            return res.status(403).json({ success: false, message: "Employer only" });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file provided" });
        }
        const file = req.file;
        const filename = `${req.user.id}-${Date.now()}.${file.originalname.split(".").pop()}`;
        const result = await (0, storage_1.uploadImage)(file.buffer, "company-logos", filename);
        if (!result.success || !result.url) {
            return res.status(500).json({ success: false, message: result.error || "Failed to upload file" });
        }
        res.json({
            success: true,
            data: {
                url: result.url,
                path: result.path,
            },
        });
    }
    catch (err) {
        console.error("Company logo upload error:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to upload company logo" });
    }
});
/**
 * POST /api/upload/job-submission
 * Upload job submission PDF (student only, for their accepted job)
 */
router.post("/job-submission/:taskId", requireAuth_1.requireAuth, upload.single("file"), async (req, res) => {
    try {
        if (req.user?.role !== "student") {
            return res.status(403).json({ success: false, message: "Student only" });
        }
        const task = await internship_1.Internship.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        if (task.acceptedStudentId?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized for this job" });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file provided" });
        }
        const file = req.file;
        // Only accept PDF files
        if (file.mimetype !== "application/pdf") {
            return res.status(400).json({ success: false, message: "Only PDF files are allowed" });
        }
        const filename = `task-${task._id}-${Date.now()}.pdf`;
        const result = await (0, storage_1.uploadPDF)(file.buffer, "job-submissions", filename);
        if (!result.success || !result.url) {
            return res.status(500).json({ success: false, message: result.error || "Failed to upload file" });
        }
        // Update task with submission URL
        task.submissionProofUrl = result.url;
        await task.save();
        res.json({
            success: true,
            data: {
                url: result.url,
                path: result.path,
            },
        });
    }
    catch (err) {
        console.error("Job submission upload error:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to upload job submission" });
    }
});
/**
 * POST /api/upload/chat-attachment/:taskId
 * Upload chat attachment (for task chat)
 */
router.post("/chat-attachment/:taskId", requireAuth_1.requireAuth, upload.single("file"), async (req, res) => {
    try {
        const task = await internship_1.Internship.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        // Check access
        const isStudent = req.user?.role === "student" && task.acceptedStudentId?.toString() === req.user.id;
        const isEmployer = req.user?.role === "employer" && task.employerId.toString() === req.user.id;
        const isAdmin = req.user?.role === "admin";
        if (!isStudent && !isEmployer && !isAdmin) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file provided" });
        }
        const file = req.file;
        const filename = `${Date.now()}-${file.originalname}`;
        const result = await (0, storage_1.uploadChatAttachment)(file.buffer, String(task._id), filename, file.mimetype);
        if (!result.success || !result.url) {
            return res.status(500).json({ success: false, message: result.error || "Failed to upload file" });
        }
        res.json({
            success: true,
            data: {
                url: result.url,
                path: result.path,
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
            },
        });
    }
    catch (err) {
        console.error("Chat attachment upload error:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to upload attachment" });
    }
});
/**
 * DELETE /api/upload/:bucket/:path
 * Delete a file from Supabase Storage (admin only, or file owner)
 */
router.delete("/:bucket/:path", requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { bucket, path } = req.params;
        // Validate bucket name
        const validBuckets = Object.values(supabase_1.STORAGE_BUCKETS);
        if (!validBuckets.includes(bucket)) {
            return res.status(400).json({ success: false, message: "Invalid bucket name" });
        }
        // Admin can delete any file, others can only delete their own
        if (req.user?.role !== "admin") {
            // Check if path contains user ID
            if (!path.includes(req.user.id)) {
                return res.status(403).json({ success: false, message: "Not authorized to delete this file" });
            }
        }
        const success = await (0, storage_1.deleteFile)(bucket, decodeURIComponent(path));
        if (!success) {
            return res.status(500).json({ success: false, message: "Failed to delete file" });
        }
        res.json({ success: true, message: "File deleted successfully" });
    }
    catch (err) {
        console.error("File delete error:", err);
        res.status(500).json({ success: false, message: err.message || "Failed to delete file" });
    }
});
exports.default = router;
