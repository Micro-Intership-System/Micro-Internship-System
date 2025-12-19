import { Router } from "express";
import { User } from "../models/user";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// require logged-in student
async function requireStudent(req: any, res: any, next: any) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res
        .status(403)
        .json({ success: false, message: "Student account required" });
    }

    req.student = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * GET /api/student/me
 * Get own student profile (includes gamification fields)
 */
router.get("/me", requireStudent, (req: any, res) => {
  const s = req.student;
  res.json({
    success: true,
    data: {
      id: s._id,
      name: s.name,
      email: s.email,
      role: s.role,
      institution: s.institution,
      skills: s.skills,
      bio: s.bio,
      profilePicture: s.profilePicture,
      // Gamification fields
      gold: s.gold || 0,
      starRating: s.starRating || 1,
      totalTasksCompleted: s.totalTasksCompleted || 0,
      averageCompletionTime: s.averageCompletionTime || 0,
      completedCourses: s.completedCourses || [],
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    },
  });
});

/**
 * PUT /api/student/me
 * Update own student profile fields
 */
router.put("/me", requireStudent, async (req: any, res) => {
  try {
    const allowed = ["name", "institution", "skills", "bio", "profilePicture"];
    const updates: any = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await User.findByIdAndUpdate(req.student._id, updates, {
      new: true,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Invalid update data" });
  }
});

/**
 * GET /api/student/all
 * Get all students (admin only)
 */
router.get("/all", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const students = await User.find({ role: "student" })
      .select("name email institution skills bio profilePicture gold starRating totalTasksCompleted averageCompletionTime createdAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load students" });
  }
});

/**
 * GET /api/student/:id
 * Public student profile (for employers)
 */
router.get("/:id", async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select(
      "name email institution skills bio profilePicture role"
    );

    if (!student || student.role !== "student") {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Invalid student ID" });
  }
});

export default router;
