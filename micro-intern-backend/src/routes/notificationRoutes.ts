import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { Notification } from "../models/notification";
import { markNotificationAsRead, getUnreadCount } from "../utils/notifications";

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for logged-in user
 */
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(skip)
      .populate("relatedTaskId", "title")
      .populate("relatedUserId", "name email");

    const total = await Notification.countDocuments({ userId: req.user.id });
    const unreadCount = await getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        unreadCount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notifications count
 */
router.get("/unread-count", requireAuth, async (req: any, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to get unread count" });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch("/:id/read", requireAuth, async (req: any, res) => {
  try {
    await markNotificationAsRead(req.params.id, req.user.id);
    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch("/read-all", requireAuth, async (req: any, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
});

export default router;

