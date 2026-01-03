"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = require("mongoose");
const paymentSchema = new mongoose_1.Schema({
    taskId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Internship", required: true },
    employerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
    releasedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    refundedAt: { type: Date },
    refundedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    disputeReason: { type: String },
    transactionId: { type: String },
    notes: { type: String },
}, { timestamps: true });
exports.Payment = (0, mongoose_1.model)("Payment", paymentSchema);
