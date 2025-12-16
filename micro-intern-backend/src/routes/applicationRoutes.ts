import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { Application } from "../models/application";
import { Internship } from "../models/internship";
import { createNotification } from "../utils/notifications";

const router = Router();

/**
 * POST /api/applications
 * Student applies to a job
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const { internshipId } = req.body;
    if (!internshipId) {
      return res.status(400).json({ success: false, message: "internshipId required" });
    }

    const job = await Internship.findById(internshipId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // prevent duplicate apply
    const existing = await Application.findOne({
      internshipId,
      studentId: req.user.id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already applied",
      });
    }

    const app = await Application.create({
      internshipId,
      employerId: job.employerId,
      studentId: req.user.id,
      status: "applied",
    });

    // Notify employer
    await createNotification(
      job.employerId.toString(),
      "application_received",
      "New Application",
      `You received a new application for "${job.title}"`,
      job._id.toString(),
      req.user.id
    );

    res.status(201).json({ success: true, data: app });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to apply" });
  }
});


/**
 * GET /api/applications/me
 * Get applications of logged-in student
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const apps = await Application.find({ studentId: req.user.id })
      .populate("internshipId", "title companyName")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: apps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load applications" });
  }
});

/**
 * PATCH /api/applications/:id/accept
 * Employer accepts an application
 */
router.patch("/:id/accept", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "employer") {
      return res.status(403).json({ success: false, message: "Employers only" });
    }

    const application = await Application.findById(req.params.id).populate("internshipId");
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const task = application.internshipId as any;
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
    await Application.updateMany(
      {
        internshipId: task._id,
        _id: { $ne: application._id },
        status: { $in: ["applied", "evaluating"] },
      },
      { status: "rejected" }
    );

    // Accept this application
    application.status = "accepted";
    await application.save();

    // Update task
    task.status = "in_progress";
    task.acceptedStudentId = application.studentId;
    task.acceptedAt = new Date();
    await task.save();

    // Notify student
    await createNotification(
      application.studentId.toString(),
      "application_accepted",
      "Application Accepted!",
      `Your application for "${task.title}" has been accepted!`,
      task._id.toString(),
      req.user.id
    );

    res.json({ success: true, data: application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to accept application" });
  }
});

/**
 * PATCH /api/applications/:id/reject
 * Employer rejects an application
 */
router.patch("/:id/reject", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "employer") {
      return res.status(403).json({ success: false, message: "Employers only" });
    }

    const application = await Application.findById(req.params.id).populate("internshipId");
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const task = application.internshipId as any;
    if (task.employerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not your task" });
    }

    application.status = "rejected";
    await application.save();

    // Notify student
    await createNotification(
      application.studentId.toString(),
      "application_rejected",
      "Application Update",
      `Your application for "${task.title}" was not selected.`,
      task._id.toString(),
      req.user.id
    );

    res.json({ success: true, data: application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to reject application" });
  }
});

/**
 * POST /api/applications/task/:taskId/complete
 * Student or employer marks task as completed
 */
router.post("/task/:taskId/complete", requireAuth, async (req: any, res) => {
  try {
    const task = await Internship.findById(req.params.taskId);
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
      await createNotification(
        task.employerId.toString(),
        "task_completed",
        "Task Completed",
        `Task "${task.title}" has been marked as completed by the student`,
        task._id.toString(),
        req.user.id
      );
    } else {
      await createNotification(
        task.acceptedStudentId!.toString(),
        "task_completed",
        "Task Completed",
        `Your task "${task.title}" has been marked as completed by the employer`,
        task._id.toString(),
        req.user.id
      );
    }

    res.json({ success: true, data: task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to complete task" });
  }
});

export default router;
