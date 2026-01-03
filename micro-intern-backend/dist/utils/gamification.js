"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStarRating = calculateStarRating;
exports.calculateTaskXP = calculateTaskXP;
exports.calculateTaskGold = calculateTaskGold;
/**
 * Calculate star rating based on XP and performance
 * Stars are primarily based on employer reviews, but this provides a baseline
 */
function calculateStarRating(xp, totalTasksCompleted, averageCompletionTime) {
    // Base star from XP (1-3 stars)
    let stars = 1;
    if (xp >= 500)
        stars = 2;
    if (xp >= 2000)
        stars = 3;
    // Bonus for completion rate and speed
    if (totalTasksCompleted >= 5)
        stars = Math.min(5, stars + 1);
    if (totalTasksCompleted >= 15)
        stars = Math.min(5, stars + 1);
    if (averageCompletionTime > 0 && averageCompletionTime <= 3) {
        stars = Math.min(5, stars + 1); // Fast completion bonus
    }
    return Math.min(5, Math.max(1, stars));
}
/**
 * Calculate XP reward for completing a task
 */
function calculateTaskXP(budget, priorityLevel) {
    const baseXP = Math.floor(budget / 10); // 10 BDT = 1 XP base
    const multiplier = priorityLevel === "high" ? 1.5 : priorityLevel === "medium" ? 1.2 : 1.0;
    return Math.floor(baseXP * multiplier);
}
/**
 * Calculate Gold reward for completing a task
 */
function calculateTaskGold(budget) {
    // Students earn gold equal to 10% of task budget
    return Math.floor(budget * 0.1);
}
