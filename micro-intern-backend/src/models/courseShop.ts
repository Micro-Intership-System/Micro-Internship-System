import { Schema, model, Document } from "mongoose";

export interface ICourseShopItem extends Document {
  title: string;
  description: string;
  cost: number; // Gold cost
  category: string; // e.g., "Web Development", "Data Science", "Design"
  duration: string; // e.g., "4 weeks", "8 hours"
  instructor?: string;
  thumbnailUrl?: string;
  learningOutcomes?: string[]; // What students will learn
  prerequisites?: string[]; // Required skills/courses
  isActive: boolean;
}

const courseShopItemSchema = new Schema<ICourseShopItem>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    cost: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    duration: { type: String, required: true },
    instructor: { type: String },
    thumbnailUrl: { type: String },
    learningOutcomes: [{ type: String }],
    prerequisites: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CourseShopItem = model<ICourseShopItem>("CourseShopItem", courseShopItemSchema);

