"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const mongoose_1 = require("mongoose");
const applicationSchema = new mongoose_1.Schema({
    internshipId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Internship",
        required: true,
    },
    studentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    employerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    status: {
        type: String,
        enum: ["evaluating", "accepted", "rejected", "applied"],
        default: "evaluating",
    },
    message: { type: String },
    cvUrl: { type: String },
    rejectionReason: { type: String }, // Reason provided by employer when rejecting
}, { timestamps: true });
exports.Application = (0, mongoose_1.model)("Application", applicationSchema);
