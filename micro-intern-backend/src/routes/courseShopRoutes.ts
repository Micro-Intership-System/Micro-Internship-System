import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth } from "../middleware/requireAuth";
import { CourseShopItem } from "../models/courseShop";
import { StudentCourse } from "../models/studentCourse";
import { User } from "../models/user";
import { generateCourseCertificate } from "../utils/certificates";

const router = Router();

/**
 * GET /api/shop/courses
 * Get all available courses
 */
router.get("/courses", async (req, res) => {
  try {
    const { category } = req.query;
    const query: any = { isActive: true };
    if (category) query.category = category;

    const courses = await CourseShopItem.find(query).sort({ cost: 1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load courses" });
  }
});

/**
 * GET /api/shop/courses/:courseId
 * Get course details
 */
router.get("/courses/:courseId", async (req, res) => {
  try {
    const course = await CourseShopItem.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    res.json({ success: true, data: course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load course" });
  }
});

/**
 * POST /api/shop/courses/:courseId/enroll
 * Student enrolls in a course
 */
router.post("/courses/:courseId/enroll", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    let course = null;
    // Try to find course by ID (only if it's a valid ObjectId)
    if (Types.ObjectId.isValid(req.params.courseId)) {
      course = await CourseShopItem.findById(req.params.courseId);
    }
    
    // If course not found and courseData is provided, create it (for predefined courses)
    if (!course && req.body.courseData) {
      const courseData = req.body.courseData;
      // Check if course with same title already exists
      course = await CourseShopItem.findOne({ title: courseData.title });
      if (!course) {
        course = await CourseShopItem.create({
          title: courseData.title,
          description: courseData.description,
          cost: courseData.cost,
          category: courseData.category,
          duration: courseData.duration,
          instructor: courseData.instructor,
          thumbnailUrl: courseData.thumbnailUrl,
          learningOutcomes: courseData.learningOutcomes,
          prerequisites: courseData.prerequisites,
          isActive: true,
        });
      }
    }
    
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Check if already enrolled
    const existing = await StudentCourse.findOne({
      studentId: student._id,
      courseId: course._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    if ((student.gold || 0) < course.cost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient gold. You have ${student.gold || 0}, need ${course.cost}`,
      });
    }

    // Deduct gold and enroll
    student.gold = (student.gold || 0) - course.cost;
    await student.save();

    const enrollment = await StudentCourse.create({
      studentId: student._id,
      courseId: course._id,
      progress: 0,
    });

    res.json({
      success: true,
      message: `Enrolled in "${course.title}" for ${course.cost} gold`,
      data: { enrollment, course },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to enroll in course" });
  }
});

/**
 * GET /api/shop/my-courses
 * Get student's enrolled courses
 */
router.get("/my-courses", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const enrollments = await StudentCourse.find({ studentId: req.user.id })
      .populate("courseId")
      .sort({ enrolledAt: -1 });

    res.json({ success: true, data: enrollments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load courses" });
  }
});

/**
 * PATCH /api/shop/courses/:courseId/complete
 * Mark course as completed (adds to accreditation)
 */
router.patch("/courses/:courseId/complete", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({ success: false, message: "Students only" });
    }

    const enrollment = await StudentCourse.findOne({
      studentId: req.user.id,
      courseId: req.params.courseId,
    }).populate("courseId");

    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found" });
    }

    if (enrollment.completedAt) {
      return res.status(400).json({
        success: false,
        message: "Course already completed",
      });
    }

    const course = enrollment.courseId as any;
    
    enrollment.progress = 100;
    const completedAt = new Date();
    enrollment.completedAt = completedAt;
    
    // Generate certificate using the completedAt date
    try {
      const certificateId = await generateCourseCertificate(
        req.user.id,
        course._id.toString(),
        completedAt
      );
      enrollment.certificateUrl = certificateId;
    } catch (err) {
      console.error("Failed to generate certificate:", err);
      // Continue without certificate if generation fails
    }
    
    await enrollment.save();

    // Add course to student's completed courses and skills
    const student = await User.findById(req.user.id);

    if (student) {
      if (!student.completedCourses) {
        student.completedCourses = [];
      }
      if (!student.completedCourses.includes(course._id.toString())) {
        student.completedCourses.push(course._id.toString());
      }

      // Add learning outcomes as skills
      if (course.learningOutcomes && course.learningOutcomes.length > 0) {
        if (!student.skills) {
          student.skills = [];
        }
        course.learningOutcomes.forEach((outcome: string) => {
          if (!student.skills!.includes(outcome)) {
            student.skills!.push(outcome);
          }
        });
      }

      await student.save();
    }

    res.json({
      success: true,
      message: "Course completed and added to your accreditation",
      data: enrollment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to complete course" });
  }
});

export default router;

