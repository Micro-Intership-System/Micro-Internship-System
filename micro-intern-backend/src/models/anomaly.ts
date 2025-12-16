import { Schema, model, Document, Types } from "mongoose";

export type AnomalyType = 
  | "employer_inactivity"
  | "student_overwork"
  | "missed_deadline"
  | "delayed_payment"
  | "task_stalled";

export type AnomalySeverity = "low" | "medium" | "high" | "critical";
export type AnomalyStatus = "open" | "investigating" | "resolved" | "dismissed";

export interface IAnomaly extends Document {
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  
  // Related entities
  taskId?: Types.ObjectId;
  userId?: Types.ObjectId; // Student or Employer involved
  employerId?: Types.ObjectId;
  studentId?: Types.ObjectId;
  
  // Details
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId; // Admin who resolved it
  notes?: string;
}

const anomalySchema = new Schema<IAnomaly>(
  {
    type: {
      type: String,
      enum: ["employer_inactivity", "student_overwork", "missed_deadline", "delayed_payment", "task_stalled"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "investigating", "resolved", "dismissed"],
      default: "open",
    },
    taskId: { type: Schema.Types.ObjectId, ref: "Internship" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    employerId: { type: Schema.Types.ObjectId, ref: "User" },
    studentId: { type: Schema.Types.ObjectId, ref: "User" },
    description: { type: String, required: true },
    detectedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Anomaly = model<IAnomaly>("Anomaly", anomalySchema);

