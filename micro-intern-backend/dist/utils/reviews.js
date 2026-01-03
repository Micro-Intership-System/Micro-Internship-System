"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentStarRating = updateStudentStarRating;
exports.getUserAverageRating = getUserAverageRating;
const taskReview_1 = require("../models/taskReview");
const user_1 = require("../models/user");
const gamification_1 = require("./gamification");
/**
 * Update student's star rating based on all employer reviews
 */
async function updateStudentStarRating(studentId) {
    const reviews = await taskReview_1.TaskReview.find({
        reviewedId: studentId,
        reviewType: "employer_to_student",
        isVisible: true,
    });
    if (reviews.length === 0) {
        // If no reviews, use calculated rating from gamification
        const student = await user_1.User.findById(studentId);
        if (student) {
            const calculatedRating = (0, gamification_1.calculateStarRating)(student.xp || 0, student.totalTasksCompleted || 0, student.averageCompletionTime || 0);
            student.starRating = calculatedRating;
            await student.save();
        }
        return;
    }
    // Calculate average from reviews
    const totalStars = reviews.reduce((sum, review) => sum + review.starRating, 0);
    const averageRating = totalStars / reviews.length;
    // Round to nearest 0.5 (e.g., 3.7 -> 3.5, 3.8 -> 4.0)
    const roundedRating = Math.round(averageRating * 2) / 2;
    // Update student
    const student = await user_1.User.findById(studentId);
    if (student) {
        student.starRating = Math.max(1, Math.min(5, roundedRating));
        await student.save();
    }
}
/**
 * Get average rating for a user
 */
async function getUserAverageRating(userId, reviewType) {
    const reviews = await taskReview_1.TaskReview.find({
        reviewedId: userId,
        reviewType,
        isVisible: true,
    });
    if (reviews.length === 0)
        return 0;
    const totalStars = reviews.reduce((sum, review) => sum + review.starRating, 0);
    return Math.round((totalStars / reviews.length) * 10) / 10;
}
