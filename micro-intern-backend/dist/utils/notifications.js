"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.markNotificationAsRead = markNotificationAsRead;
exports.getUnreadCount = getUnreadCount;
const notification_1 = require("../models/notification");
/**
 * Create and send a notification to a user
 */
async function createNotification(userId, type, title, message, relatedTaskId, relatedUserId, metadata) {
    const notification = await notification_1.Notification.create({
        userId,
        type,
        title,
        message,
        relatedTaskId,
        relatedUserId,
        metadata,
    });
    // TODO: Integrate with email/SMS service here
    // For now, we just create the notification in DB
    return notification;
}
/**
 * Mark notification as read
 */
async function markNotificationAsRead(notificationId, userId) {
    await notification_1.Notification.updateOne({ _id: notificationId, userId }, { isRead: true });
}
/**
 * Get unread notifications count for a user
 */
async function getUnreadCount(userId) {
    return await notification_1.Notification.countDocuments({ userId, isRead: false });
}
