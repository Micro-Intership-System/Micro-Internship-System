import { Schema, model, Document } from "mongoose";

export interface IReview extends Document {
  name: string;
  role: string;
  quote: string;
  avatarUrl?: string;
}

const reviewSchema = new Schema<IReview>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    quote: { type: String, required: true },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

export const Review = model<IReview>("Review", reviewSchema);
