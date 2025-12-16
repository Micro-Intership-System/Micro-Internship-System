import { TaskReview } from "../models/taskReview";
import { User } from "../models/user";
import { calculateStarRating } from "./gamification";

/**
 * Update student's star rating based on all employer reviews
 */
export async function updateStudentStarRating(studentId: string): Promise<void> {
  const reviews = await TaskReview.find({
    reviewedId: studentId,
    reviewType: "employer_to_student",
    isVisible: true,
  });

  if (reviews.length === 0) {
    // If no reviews, use calculated rating from gamification
    const student = await User.findById(studentId);
    if (student) {
      const calculatedRating = calculateStarRating(
        student.xp || 0,
        student.totalTasksCompleted || 0,
        student.averageCompletionTime || 0
      );
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
  const student = await User.findById(studentId);
  if (student) {
    student.starRating = Math.max(1, Math.min(5, roundedRating));
    await student.save();
  }
}

/**
 * Get average rating for a user
 */
export async function getUserAverageRating(userId: string, reviewType: "employer_to_student" | "student_to_employer"): Promise<number> {
  const reviews = await TaskReview.find({
    reviewedId: userId,
    reviewType,
    isVisible: true,
  });

  if (reviews.length === 0) return 0;

  const totalStars = reviews.reduce((sum, review) => sum + review.starRating, 0);
  return Math.round((totalStars / reviews.length) * 10) / 10;
}

