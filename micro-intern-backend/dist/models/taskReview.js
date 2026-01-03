"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskReview = void 0;
const mongoose_1 = require("mongoose");
const taskReviewSchema = new mongoose_1.Schema({
    taskId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Internship", required: true },
    reviewerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    reviewerRole: { type: String, enum: ["employer", "student"], required: true },
    reviewedId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    starRating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    reviewType: {
        type: String,
        enum: ["employer_to_student", "student_to_employer"],
        required: true,
    },
    isVisible: { type: Boolean, default: true },
}, { timestamps: true });
// Prevent duplicate reviews for same task
taskReviewSchema.index({ taskId: 1, reviewerId: 1, reviewedId: 1 }, { unique: true });
exports.TaskReview = (0, mongoose_1.model)("TaskReview", taskReviewSchema);
