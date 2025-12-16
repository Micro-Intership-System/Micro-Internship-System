import { Notification, INotification } from "../models/notification";
import { User } from "../models/user";

/**
 * Create and send a notification to a user
 */
export async function createNotification(
  userId: string,
  type: INotification["type"],
  title: string,
  message: string,
  relatedTaskId?: string,
  relatedUserId?: string,
  metadata?: Record<string, any>
): Promise<INotification> {
  const notification = await Notification.create({
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
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  await Notification.updateOne(
    { _id: notificationId, userId },
    { isRead: true }
  );
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return await Notification.countDocuments({ userId, isRead: false });
}

