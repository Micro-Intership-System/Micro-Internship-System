"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
    relatedTaskId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Internship" },
    relatedUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
