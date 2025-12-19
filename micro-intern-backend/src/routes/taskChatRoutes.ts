import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { TaskChatMessage } from "../models/taskChat";
import { Internship } from "../models/internship";

const router = Router();

/**
 * GET /api/task-chat/:taskId
 * Get all messages for a task
 */
router.get("/:taskId", requireAuth, async (req: any, res) => {
  try {
    const task = await Internship.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Check access: student, employer, or admin
    const isStudent = req.user?.role === "student" && task.acceptedStudentId?.toString() === req.user.id;
    const isEmployer = req.user?.role === "employer" && task.employerId.toString() === req.user.id;
    const isAdmin = req.user?.role === "admin";

    if (!isStudent && !isEmployer && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const messages = await TaskChatMessage.find({
      taskId: task._id,
      status: { $ne: "deleted" },
    })
      .populate("senderId", "name email profilePicture")
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load messages" });
  }
});

/**
 * POST /api/task-chat/:taskId
 * Send a message in task chat
 */
router.post("/:taskId", requireAuth, async (req: any, res) => {
  try {
    const task = await Internship.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Check access
    const isStudent = req.user?.role === "student" && task.acceptedStudentId?.toString() === req.user.id;
    const isEmployer = req.user?.role === "employer" && task.employerId.toString() === req.user.id;
    const isAdmin = req.user?.role === "admin";

    if (!isStudent && !isEmployer && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Allow messages for disputed tasks, but not for completed/cancelled (unless disputed)
    // Admins can always send messages in dispute chats
    if ((task.status === "completed" || task.status === "cancelled") && task.submissionStatus !== "disputed" && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Cannot send messages to completed/cancelled tasks",
      });
    }

    const { text, attachments } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message text required" });
    }

    const message = await TaskChatMessage.create({
      taskId: task._id,
      senderId: req.user.id,
      text: text.trim(),
      attachments: attachments || [],
    });

    const populated = await message.populate("senderId", "name email profilePicture");

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

/**
 * DELETE /api/task-chat/:messageId
 * Delete a message (soft delete)
 */
router.delete("/:messageId", requireAuth, async (req: any, res) => {
  try {
    const message = await TaskChatMessage.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Only sender or admin can delete
    if (message.senderId.toString() !== req.user.id && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    message.status = "deleted";
    await message.save();

    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete message" });
  }
});

/**
 * POST /api/task-chat/:messageId/moderate
 * Admin moderates a message
 */
router.post("/:messageId/moderate", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admins only" });
    }

    const message = await TaskChatMessage.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    const { reason } = req.body;
    message.status = "moderated";
    message.moderatedBy = req.user.id;
    message.moderatedAt = new Date();
    message.moderationReason = reason || "Inappropriate content";

    await message.save();

    res.json({ success: true, message: "Message moderated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to moderate message" });
  }
});

export default router;

