import { Schema, model, Document } from "mongoose";

export interface IInternship extends Document {
  title: string;
  employer: string;
  location: string;
  duration: string;
  budget: number;
  skills: string[];
  tags: string[];
  bannerUrl?: string;
  isFeatured: boolean;
}

const internshipSchema = new Schema<IInternship>(
  {
    title: { type: String, required: true },
    employer: { type: String, required: true },
    location: { type: String, required: true },
    duration: { type: String, required: true },
    budget: { type: Number, required: true },
    skills: [{ type: String }],
    tags: [{ type: String }],
    bannerUrl: { type: String },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Internship = model<IInternship>("Internship", internshipSchema);
