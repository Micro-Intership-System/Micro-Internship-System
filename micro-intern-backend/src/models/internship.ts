import { Schema, model, type Document, type Types } from "mongoose";

export type PriorityLevel = "high" | "medium" | "low";

export interface IInternship extends Document {
  title: string;
  location: string;
  duration: string;
  budget: number;
  description: string;

  priorityLevel: PriorityLevel;
  skills: string[];
  tags: string[];
  bannerUrl?: string;
  isFeatured: boolean;

  employerId: Types.ObjectId;
  companyName: string;
}

const internshipSchema = new Schema<IInternship>(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    budget: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },

    priorityLevel: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    skills: [{ type: String, default: [] }],
    tags: [{ type: String, default: [] }],
    bannerUrl: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },

    // attach server-side from token + employer profile
    employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Internship = model<IInternship>("Internship", internshipSchema);
