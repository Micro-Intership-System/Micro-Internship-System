"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const notification_1 = require("../models/notification");
const notifications_1 = require("../utils/notifications");
const router = (0, express_1.Router)();
/**
 * GET /api/notifications
 * Get all notifications for logged-in user
 */
router.get("/", requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const notifications = await notification_1.Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .populate("relatedTaskId", "title")
            .populate("relatedUserId", "name email");
        const total = await notification_1.Notification.countDocuments({ userId: req.user.id });
        const unreadCount = await (0, notifications_1.getUnreadCount)(req.user.id);
        res.json({
            success: true,
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                unreadCount,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load notifications" });
    }
});
/**
 * GET /api/notifications/unread-count
 * Get unread notifications count
 */
router.get("/unread-count", requireAuth_1.requireAuth, async (req, res) => {
    try {
        const count = await (0, notifications_1.getUnreadCount)(req.user.id);
        res.json({ success: true, data: { count } });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to get unread count" });
    }
});
/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch("/:id/read", requireAuth_1.requireAuth, async (req, res) => {
    try {
        await (0, notifications_1.markNotificationAsRead)(req.params.id, req.user.id);
        res.json({ success: true, message: "Notification marked as read" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to mark notification as read" });
    }
});
/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch("/read-all", requireAuth_1.requireAuth, async (req, res) => {
    try {
        await notification_1.Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
        res.json({ success: true, message: "All notifications marked as read" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to mark all as read" });
    }
});
exports.default = router;
