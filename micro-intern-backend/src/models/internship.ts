import { Schema, model, type Document, type Types } from "mongoose";

export type PriorityLevel = "high" | "medium" | "low";
export type TaskStatus = "posted" | "in_progress" | "completed" | "cancelled";

export type SubmissionStatus = "pending" | "submitted" | "confirmed" | "rejected" | "disputed";

export interface IInternship extends Document {
  title: string;
  location: string;
  duration: string;
  gold: number; // Changed from budget to gold
  description: string;
  deadline?: Date;

  priorityLevel: PriorityLevel;
  skills: string[];
  tags: string[];
  bannerUrl?: string;
  isFeatured: boolean;
  status: TaskStatus; // Task lifecycle status

  employerId: Types.ObjectId;
  companyName: string;
  employerRating?: number; // Average rating from student reviews (0-5)
  employerCompletedJobs?: number; // Total completed jobs count
  acceptedStudentId?: Types.ObjectId; // Student who was accepted
  acceptedAt?: Date; // When student was accepted
  completedAt?: Date; // When task was completed
  
  // Submission fields
  submissionStatus?: SubmissionStatus;
  submissionProofUrl?: string; // Optional Supabase PDF URL
  submissionReport?: {
    timeTaken?: number; // in hours
    completionNotes?: string;
    submittedAt?: Date;
  };
  rejectionReason?: string; // Required if rejected
  disputeChatId?: Types.ObjectId; // Reference to dispute chat if created
  disputeEscrowAmount?: number; // 50% of gold paid by student when reporting rejection
}

const internshipSchema = new Schema<IInternship>(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    gold: { type: Number, required: true, min: 0 }, // Changed from budget to gold
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
    employerRating: { type: Number, min: 0, max: 5 }, // Average rating from student reviews
    employerCompletedJobs: { type: Number, min: 0, default: 0 }, // Total completed jobs count
    acceptedStudentId: { type: Schema.Types.ObjectId, ref: "User" },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    
    // Submission fields
    submissionStatus: { type: String, enum: ["pending", "submitted", "confirmed", "rejected", "disputed"] },
    submissionProofUrl: { type: String }, // Optional Supabase PDF URL
    submissionReport: {
      timeTaken: { type: Number }, // in hours
      completionNotes: { type: String },
      submittedAt: { type: Date },
    },
    rejectionReason: { type: String }, // Required if rejected
    disputeChatId: { type: Schema.Types.ObjectId, ref: "TaskChat" }, // Reference to dispute chat
    disputeEscrowAmount: { type: Number }, // 50% of gold paid by student when reporting rejection
  },
  { timestamps: true }
);

export const Internship = model<IInternship>("Internship", internshipSchema);
