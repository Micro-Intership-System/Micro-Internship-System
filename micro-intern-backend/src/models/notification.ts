import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "application_received"
  | "application_accepted"
  | "application_rejected"
  | "task_assigned"
  | "task_completed"
  | "task_submitted"
  | "task_confirmed"
  | "task_rejected"
  | "task_cancelled"
  | "payment_released"
  | "payment_received"
  | "delayed_payment"
  | "message_received"
  | "anomaly_detected"
  | "company_name_change"
  | "milestone_reached"
  | "review_received"
  | "dispute_resolved";

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
        "task_submitted",
        "task_confirmed",
        "task_rejected",
        "task_cancelled",
        "payment_released",
        "payment_received",
        "delayed_payment",
        "message_received",
        "anomaly_detected",
        "company_name_change",
        "milestone_reached",
        "review_received",
        "dispute_resolved",
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

