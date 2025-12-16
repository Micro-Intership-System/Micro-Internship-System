import { Schema, model, Document, Types } from "mongoose";

export type MessageStatus = "sent" | "deleted" | "moderated";

export interface ITaskChatMessage extends Document {
  taskId: Types.ObjectId;
  senderId: Types.ObjectId;
  text: string;
  status: MessageStatus;
  
  // File attachments
  attachments?: Array<{
    filename: string;
    url: string;
    type: string;
    size: number;
  }>;
  
  // Moderation
  moderatedBy?: Types.ObjectId; // Admin who moderated
  moderatedAt?: Date;
  moderationReason?: string;
  
  // Reactions (optional)
  reactions?: Array<{
    userId: Types.ObjectId;
    emoji: string;
  }>;
}

const taskChatMessageSchema = new Schema<ITaskChatMessage>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Internship", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    moderationReason: { type: String },
    reactions: [{
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      emoji: { type: String },
    }],
  },
  { timestamps: true }
);

// Index for efficient queries
taskChatMessageSchema.index({ taskId: 1, createdAt: -1 });

export const TaskChatMessage = model<ITaskChatMessage>("TaskChatMessage", taskChatMessageSchema);

