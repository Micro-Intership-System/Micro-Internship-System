import { Schema, model, Document, Types } from "mongoose";

export type PaymentStatus = "pending" | "escrowed" | "released" | "refunded" | "disputed";
export type PaymentType = "task_payment" | "refund" | "penalty";

export interface IPayment extends Document {
  taskId: Types.ObjectId;
  employerId: Types.ObjectId;
  studentId: Types.ObjectId;
  
  amount: number;
  status: PaymentStatus;
  type: PaymentType;
  
  // Escrow fields
  escrowedAt?: Date;
  releasedAt?: Date;
  releasedBy?: Types.ObjectId; // Employer or Admin
  
  // Refund/Dispute fields
  refundedAt?: Date;
  refundedBy?: Types.ObjectId; // Admin
  disputeReason?: string;
  
  // Transaction details
  transactionId?: string;
  notes?: string;
}

const paymentSchema = new Schema<IPayment>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Internship", required: true },
    employerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "escrowed", "released", "refunded", "disputed"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["task_payment", "refund", "penalty"],
      default: "task_payment",
    },
    escrowedAt: { type: Date },
    releasedAt: { type: Date },
    releasedBy: { type: Schema.Types.ObjectId, ref: "User" },
    refundedAt: { type: Date },
    refundedBy: { type: Schema.Types.ObjectId, ref: "User" },
    disputeReason: { type: String },
    transactionId: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>("Payment", paymentSchema);

