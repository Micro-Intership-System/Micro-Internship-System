"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskChatMessage = void 0;
const mongoose_1 = require("mongoose");
const taskChatMessageSchema = new mongoose_1.Schema({
    taskId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Internship", required: true },
    senderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    status: {
        type: String,
        enum: ["sent", "deleted", "moderated"],
        default: "sent",
    },
    attachments: [{
            filename: { type: String },
            url: { type: String },
            type: { type: String },
            size: { type: Number },
        }],
    moderatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    moderationReason: { type: String },
    reactions: [{
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            emoji: { type: String },
        }],
}, { timestamps: true });
// Index for efficient queries
taskChatMessageSchema.index({ taskId: 1, createdAt: -1 });
exports.TaskChatMessage = (0, mongoose_1.model)("TaskChatMessage", taskChatMessageSchema);
