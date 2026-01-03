import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import multer from "multer";
import { uploadImage, uploadPDF, uploadChatAttachment, deleteFile } from "../utils/storage";
import { STORAGE_BUCKETS } from "../config/supabase";
import { Internship } from "../models/internship";

const router = Router();

// Configure multer for memory storage (we'll upload to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * POST /api/upload/profile-picture
 * Upload profile picture
 */
router.post("/profile-picture", requireAuth, upload.single("file"), async (req: any, res) => {
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

    const result = await uploadImage(file.buffer, "profile-pictures", filename);

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
  } catch (err: any) {
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
router.post("/company-logo", requireAuth, upload.single("file"), async (req: any, res) => {
  try {
    if (req.user?.role !== "employer") {
      return res.status(403).json({ success: false, message: "Employer only" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const file = req.file;
    const filename = `${req.user.id}-${Date.now()}.${file.originalname.split(".").pop()}`;

    const result = await uploadImage(file.buffer, "company-logos", filename);

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
  } catch (err: any) {
    console.error("Company logo upload error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to upload company logo" });
  }
});

/**
 * POST /api/upload/job-submission
 * Upload job submission PDF (student only, for their accepted job)
 */
router.post("/job-submission/:taskId", requireAuth, upload.single("file"), async (req: any, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Student only" });
    }

    const task = await Internship.findById(req.params.taskId);
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

    const result = await uploadPDF(file.buffer, "job-submissions", filename);

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
  } catch (err: any) {
    console.error("Job submission upload error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to upload job submission" });
  }
});

/**
 * POST /api/upload/chat-attachment/:taskId
 * Upload chat attachment (for task chat)
 */
router.post("/chat-attachment/:taskId", requireAuth, upload.single("file"), async (req: any, res) => {
  try {
    const task = await Internship.findById(req.params.taskId);
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

    const result = await uploadChatAttachment(file.buffer, task._id.toString(), filename, file.mimetype);

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
  } catch (err: any) {
    console.error("Chat attachment upload error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to upload attachment" });
  }
});

/**
 * DELETE /api/upload/:bucket/:path
 * Delete a file from Supabase Storage (admin only, or file owner)
 */
router.delete("/:bucket/:path", requireAuth, async (req: any, res) => {
  try {
    const { bucket, path } = req.params;

    // Validate bucket name
    const validBuckets = Object.values(STORAGE_BUCKETS);
    if (!validBuckets.includes(bucket as any)) {
      return res.status(400).json({ success: false, message: "Invalid bucket name" });
    }

    // Admin can delete any file, others can only delete their own
    if (req.user?.role !== "admin") {
      // Check if path contains user ID
      if (!path.includes(req.user.id)) {
        return res.status(403).json({ success: false, message: "Not authorized to delete this file" });
      }
    }

    const success = await deleteFile(bucket, decodeURIComponent(path));

    if (!success) {
      return res.status(500).json({ success: false, message: "Failed to delete file" });
    }

    res.json({ success: true, message: "File deleted successfully" });
  } catch (err: any) {
    console.error("File delete error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to delete file" });
  }
});

export default router;

