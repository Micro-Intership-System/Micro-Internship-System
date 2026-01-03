import { Router } from "express";
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

    // Check if courseId is a MongoDB ObjectId (24 hex characters)
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(req.params.courseId);
    let course = null;
    
    if (isMongoId) {
      // Try to find by MongoDB ID first
      course = await CourseShopItem.findById(req.params.courseId);
    }
    
    // If course not found, check if it's a predefined course
    if (!course) {
      const { courseData } = req.body;
      
      if (courseData && courseData._id === req.params.courseId) {
        try {
          // Check if a course with the same title and category already exists (to avoid duplicates)
          const existingCourse = await CourseShopItem.findOne({ 
            title: courseData.title.trim(),
            category: courseData.category 
          });
          if (existingCourse) {
            course = existingCourse;
          } else {
            // Create the predefined course in the database
            course = await CourseShopItem.create({
              title: courseData.title,
              description: courseData.description,
              cost: courseData.cost,
              category: courseData.category,
              duration: courseData.duration,
              instructor: courseData.instructor,
              thumbnailUrl: courseData.thumbnailUrl,
              learningOutcomes: courseData.learningOutcomes || [],
              prerequisites: courseData.prerequisites || [],
              isActive: true,
            });
          }
        } catch (createErr) {
          console.error("Error creating predefined course:", createErr);
          return res.status(500).json({ 
            success: false, 
            message: `Failed to create course: ${createErr instanceof Error ? createErr.message : "Unknown error"}` 
          });
        }
      } else if (!isMongoId) {
        // If it's not a MongoDB ID and no courseData provided, it's likely a predefined course
        return res.status(404).json({ 
          success: false, 
          message: `Course not found. Please provide course data for predefined courses. CourseId: ${req.params.courseId}` 
        });
      } else {
        return res.status(404).json({ 
          success: false, 
          message: `Course not found with ID: ${req.params.courseId}` 
        });
      }
    }
    
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: "Course not found or inactive" });
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
    console.error("Enrollment error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ 
      success: false, 
      message: `Failed to enroll in course: ${errorMessage}` 
    });
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
 * GET /api/shop/student/:studentId/courses
 * Get a specific student's enrolled courses (for employers viewing student portfolio)
 */
router.get("/student/:studentId/courses", requireAuth, async (req: any, res) => {
  try {
    // Allow employers and admins to view student courses
    if (req.user?.role !== "employer" && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Employers and admins only" });
    }

    const enrollments = await StudentCourse.find({ studentId: req.params.studentId })
      .populate("courseId")
      .sort({ enrolledAt: -1 });

    res.json({ success: true, data: enrollments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load student courses" });
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
    const completedAtDate = new Date();
    enrollment.completedAt = completedAtDate;
    
    // Generate certificate using the same completedAt date
    try {
      const certificateUrl = await generateCourseCertificate(
        req.user.id,
        course._id.toString(),
        completedAtDate
      );
      enrollment.certificateUrl = certificateUrl;
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

