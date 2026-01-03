"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentCourse = void 0;
const mongoose_1 = require("mongoose");
const studentCourseSchema = new mongoose_1.Schema({
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: "CourseShopItem", required: true },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    certificateUrl: { type: String },
}, { timestamps: true });
// Index for efficient queries
studentCourseSchema.index({ studentId: 1, courseId: 1 });
exports.StudentCourse = (0, mongoose_1.model)("StudentCourse", studentCourseSchema);
