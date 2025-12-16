import { Schema, model, type Document, type Types } from "mongoose";

export type PriorityLevel = "high" | "medium" | "low";
export type TaskStatus = "posted" | "in_progress" | "completed" | "cancelled";

export interface IInternship extends Document {
  title: string;
  location: string;
  duration: string;
  budget: number;
  description: string;
  deadline?: Date; // Added deadline field

  priorityLevel: PriorityLevel;
  skills: string[];
  tags: string[];
  bannerUrl?: string;
  isFeatured: boolean;
  status: TaskStatus; // Task lifecycle status

  employerId: Types.ObjectId;
  companyName: string;
  acceptedStudentId?: Types.ObjectId; // Student who was accepted
  acceptedAt?: Date; // When student was accepted
  completedAt?: Date; // When task was completed
}

const internshipSchema = new Schema<IInternship>(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    budget: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    deadline: { type: Date },

    priorityLevel: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    skills: [{ type: String, default: [] }],
    tags: [{ type: String, default: [] }],
    bannerUrl: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["posted", "in_progress", "completed", "cancelled"], default: "posted" },

    // attach server-side from token + employer profile
    employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, required: true, trim: true },
    acceptedStudentId: { type: Schema.Types.ObjectId, ref: "User" },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Internship = model<IInternship>("Internship", internshipSchema);
