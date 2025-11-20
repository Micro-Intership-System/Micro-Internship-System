import { Schema, model, Document, Types } from "mongoose";

export interface IApplication extends Document {
  internshipId: Types.ObjectId;
  name: string;
  email: string;
  message?: string;
  cvUrl?: string;
}

const applicationSchema = new Schema<IApplication>(
  {
    internshipId: { type: Schema.Types.ObjectId, ref: "Internship", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String },
    cvUrl: { type: String }
  },
  { timestamps: true }
);

export const Application = model<IApplication>("Application", applicationSchema);
