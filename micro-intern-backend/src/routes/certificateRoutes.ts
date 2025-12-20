import { Router } from "express";
import { verifyCertificate, generateCertificateHTML } from "../utils/certificates";
import { StudentCourse } from "../models/studentCourse";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/**
 * GET /api/certificates/:certificateId
 * Verify and display certificate information
 */
router.get("/:certificateId", async (req, res) => {
  try {
    const verification = await verifyCertificate(req.params.certificateId);

    if (!verification.valid) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found or invalid",
      });
    }

    res.json({
      success: true,
      data: verification,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to verify certificate" });
  }
});

/**
 * GET /api/certificates/:certificateId/html
 * Get certificate HTML for PDF generation
 */
router.get("/:certificateId/html", async (req, res) => {
  try {
    let verification = await verifyCertificate(req.params.certificateId);

    // If verification fails, try to find enrollment directly by certificateUrl
    if (!verification.valid) {
      // Try to find enrollment with matching certificateUrl
      const enrollments = await StudentCourse.find({
        certificateUrl: { $regex: req.params.certificateId },
        completedAt: { $exists: true },
      })
        .populate("studentId")
        .populate("courseId")
        .limit(1);

      if (enrollments.length > 0) {
        const enrollment = enrollments[0];
        const student = enrollment.studentId as any;
        const course = enrollment.courseId as any;

        if (student && course && enrollment.completedAt) {
          verification = {
            valid: true,
            student: {
              name: student.name,
              email: student.email,
              institution: student.institution,
            },
            course: {
              title: course.title,
              category: course.category,
              instructor: course.instructor,
            },
            completedAt: enrollment.completedAt,
          };
        }
      }
    }

    if (!verification.valid || !verification.student || !verification.course || !verification.completedAt) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found or invalid",
      });
    }

    const html = generateCertificateHTML(
      verification.student.name,
      verification.course.title,
      verification.completedAt,
      req.params.certificateId
    );

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to generate certificate HTML" });
  }
});

export default router;

