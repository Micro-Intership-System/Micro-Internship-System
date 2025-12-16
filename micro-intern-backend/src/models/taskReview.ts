import { Schema, model, Document, Types } from "mongoose";

export interface ITaskReview extends Document {
  taskId: Types.ObjectId;
  
  // Who is reviewing whom
  reviewerId: Types.ObjectId; // Employer or Student
  reviewerRole: "employer" | "student";
  reviewedId: Types.ObjectId; // Student or Employer being reviewed
  
  // Review content
  starRating: number; // 1-5 stars
  comment?: string;
  
  // Review type
  reviewType: "employer_to_student" | "student_to_employer";
  
  // Metadata
  isVisible: boolean; // For moderation
}

const taskReviewSchema = new Schema<ITaskReview>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Internship", required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewerRole: { type: String, enum: ["employer", "student"], required: true },
    reviewedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    starRating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    reviewType: {
      type: String,
      enum: ["employer_to_student", "student_to_employer"],
      required: true,
    },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent duplicate reviews for same task
taskReviewSchema.index({ taskId: 1, reviewerId: 1, reviewedId: 1 }, { unique: true });

export const TaskReview = model<ITaskReview>("TaskReview", taskReviewSchema);

