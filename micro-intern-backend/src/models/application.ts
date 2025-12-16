import { Schema, model, Document, Types } from "mongoose";

export interface IApplication extends Document {
  internshipId: Types.ObjectId;
  studentId: Types.ObjectId;
  employerId?: Types.ObjectId; // Added for easier querying
  status: "evaluating" | "accepted" | "rejected" | "applied";
  message?: string;
  cvUrl?: string;
}

const applicationSchema = new Schema<IApplication>(
  {
    internshipId: {
      type: Schema.Types.ObjectId,
      ref: "Internship",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["evaluating", "accepted", "rejected", "applied"],
      default: "evaluating",
    },
    message: { type: String },
    cvUrl: { type: String },
  },
  { timestamps: true }
);


export const Application = model<IApplication>("Application", applicationSchema);
