"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Internship = void 0;
const mongoose_1 = require("mongoose");
const internshipSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    gold: { type: Number, required: true, min: 0 }, // Changed from budget to gold
    description: { type: String, required: true, trim: true },
    deadline: { type: Date },
    priorityLevel: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    skills: [{ type: String, default: [] }],
    tags: [{ type: String, default: [] }],
    bannerUrl: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["posted", "in_progress", "completed", "cancelled"], default: "posted" },
    // attach server-side from token + employer profile
    employerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, required: true, trim: true },
    employerRating: { type: Number, min: 0, max: 5 }, // Average rating from student reviews
    employerCompletedJobs: { type: Number, min: 0, default: 0 }, // Total completed jobs count
    acceptedStudentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    // Submission fields
    submissionStatus: { type: String, enum: ["pending", "submitted", "confirmed", "rejected", "disputed"] },
    submissionProofUrl: { type: String }, // Optional Supabase PDF URL
    submissionReport: {
        timeTaken: { type: Number }, // in hours
        completionNotes: { type: String },
        submittedAt: { type: Date },
    },
    rejectionReason: { type: String }, // Required if rejected
    disputeChatId: { type: mongoose_1.Schema.Types.ObjectId, ref: "TaskChat" }, // Reference to dispute chat
    disputeEscrowAmount: { type: Number }, // 50% of gold paid by student when reporting rejection
}, { timestamps: true });
exports.Internship = (0, mongoose_1.model)("Internship", internshipSchema);
