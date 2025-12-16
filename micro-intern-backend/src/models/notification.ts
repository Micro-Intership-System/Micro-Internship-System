import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "application_received"
  | "application_accepted"
  | "application_rejected"
  | "task_assigned"
  | "task_completed"
  | "payment_released"
  | "payment_received"
  | "message_received"
  | "anomaly_detected"
  | "milestone_reached"
  | "review_received";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedTaskId?: Types.ObjectId;
  relatedUserId?: Types.ObjectId;
  metadata?: Record<string, any>; // For additional data
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "application_received",
        "application_accepted",
        "application_rejected",
        "task_assigned",
        "task_completed",
        "payment_released",
        "payment_received",
        "message_received",
        "anomaly_detected",
        "milestone_reached",
        "review_received",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedTaskId: { type: Schema.Types.ObjectId, ref: "Internship" },
    relatedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification", notificationSchema);

