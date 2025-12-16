import { Schema, model, Document, Types } from "mongoose";

export interface IStudentCourse extends Document {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrolledAt: Date;
  completedAt?: Date;
  progress: number; // 0-100 percentage
  certificateUrl?: string; // URL to completion certificate
}

const studentCourseSchema = new Schema<IStudentCourse>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "CourseShopItem", required: true },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    certificateUrl: { type: String },
  },
  { timestamps: true }
);

// Index for efficient queries
studentCourseSchema.index({ studentId: 1, courseId: 1 });

export const StudentCourse = model<IStudentCourse>("StudentCourse", studentCourseSchema);

