"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Anomaly = void 0;
const mongoose_1 = require("mongoose");
const anomalySchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ["employer_inactivity", "student_overwork", "missed_deadline", "delayed_payment", "task_stalled", "company_name_change"],
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
    taskId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Internship" },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    employerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    description: { type: String, required: true },
    detectedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
}, { timestamps: true });
exports.Anomaly = (0, mongoose_1.model)("Anomaly", anomalySchema);
