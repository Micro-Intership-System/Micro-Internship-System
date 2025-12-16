import { Router } from "express";
import { User } from "../models/user";
import { Internship } from "../models/internship";

const router = Router();

/**
 * GET /api/leaderboard
 * Get student leaderboard with stars, completed jobs, and average completion time
 */
router.get("/", async (req, res) => {
  try {
    const { sortBy = "starRating", limit = 50 } = req.query;
    
    // Get all students with their stats
    const students = await User.find({ role: "student" })
      .select("name email xp starRating gold totalTasksCompleted averageCompletionTime profilePicture institution completedCourses")
      .lean();

    // Calculate average completion time for students who don't have it
    for (const student of students) {
      if (!student.averageCompletionTime || student.averageCompletionTime === 0) {
        const completedTasks = await Internship.find({
          acceptedStudentId: student._id,
          status: "completed",
          completedAt: { $exists: true },
          acceptedAt: { $exists: true },
        }).lean();

        if (completedTasks.length > 0) {
          const totalDays = completedTasks.reduce((sum, task: any) => {
            const days = (task.completedAt.getTime() - task.acceptedAt.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0);
          student.averageCompletionTime = Math.round((totalDays / completedTasks.length) * 10) / 10; // Round to 1 decimal
        }
      }
    }

    // Sort based on sortBy parameter
    const sortField = sortBy === "stars" ? "starRating" : 
                     sortBy === "jobs" ? "totalTasksCompleted" :
                     sortBy === "time" ? "averageCompletionTime" : "starRating";

    students.sort((a, b) => {
      if (sortField === "averageCompletionTime") {
        // For time, lower is better
        return (a.averageCompletionTime || 999) - (b.averageCompletionTime || 999);
      }
      return (b[sortField as keyof typeof b] as number || 0) - (a[sortField as keyof typeof a] as number || 0);
    });

    // Limit and add position
    const leaderboard = students.slice(0, parseInt(limit as string)).map((student, index) => ({
      position: index + 1,
      ...student,
    }));

    res.json({ success: true, data: leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load leaderboard" });
  }
});

/**
 * GET /api/leaderboard/stars/:stars
 * Get students by specific star rating
 */
router.get("/stars/:stars", async (req, res) => {
  try {
    const stars = parseInt(req.params.stars);
    if (stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: "Invalid star rating (1-5)" });
    }

    const students = await User.find({
      role: "student",
      starRating: stars,
    })
      .select("name email xp starRating gold totalTasksCompleted averageCompletionTime profilePicture institution")
      .sort({ totalTasksCompleted: -1, xp: -1 });

    res.json({ success: true, data: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load students by star rating" });
  }
});

export default router;

