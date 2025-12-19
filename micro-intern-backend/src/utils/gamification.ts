/**
 * Calculate star rating based on performance (XP removed)
 * Stars are primarily based on employer reviews, but this provides a baseline
 */
export function calculateStarRating(totalTasksCompleted: number, averageCompletionTime: number): number {
  // Base star from completion count
  let stars = 1;
  if (totalTasksCompleted >= 3) stars = 2;
  if (totalTasksCompleted >= 10) stars = 3;
  if (totalTasksCompleted >= 20) stars = 4;
  
  // Bonus for completion speed
  if (averageCompletionTime > 0 && averageCompletionTime <= 3) {
    stars = Math.min(5, stars + 1); // Fast completion bonus
  }
  
  return Math.min(5, Math.max(1, stars));
}

/**
 * Calculate XP reward for completing a task
 */
export function calculateTaskXP(budget: number, priorityLevel: "high" | "medium" | "low"): number {
  const baseXP = Math.floor(budget / 10); // 10 BDT = 1 XP base
  const multiplier = priorityLevel === "high" ? 1.5 : priorityLevel === "medium" ? 1.2 : 1.0;
  return Math.floor(baseXP * multiplier);
}

/**
 * Calculate Gold reward for completing a task
 */
export function calculateTaskGold(budget: number): number {
  // Students earn gold equal to 10% of task budget
  return Math.floor(budget * 0.1);
}

