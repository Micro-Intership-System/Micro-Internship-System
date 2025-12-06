import mongoose, { Schema, Document } from "mongoose";

export interface IContactRequest extends Document {
  fromUserId: mongoose.Types.ObjectId; // student
  toUserId: mongoose.Types.ObjectId;   // employer
  message: string;
  email: string;
  createdAt: Date;
}

const ContactRequestSchema = new Schema<IContactRequest>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const ContactRequest = mongoose.model<IContactRequest>(
  "ContactRequest",
  ContactRequestSchema
);
