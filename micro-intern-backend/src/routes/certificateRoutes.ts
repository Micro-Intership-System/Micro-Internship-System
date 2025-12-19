import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { verifyCertificate, generateCertificateHTML, generateCourseCertificate } from "../utils/certificates";
import { StudentCourse } from "../models/studentCourse";

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

    // If certificate not found, try to generate it from enrollment ID (for backward compatibility)
    if (!verification.valid) {
      // Try to find enrollment by certificateUrl or _id
      const enrollment = await StudentCourse.findOne({
        $or: [
          { certificateUrl: req.params.certificateId },
          { _id: req.params.certificateId },
        ],
        completedAt: { $exists: true },
      })
        .populate("studentId")
        .populate("courseId");

      if (enrollment) {
        const student = enrollment.studentId as any;
        const course = enrollment.courseId as any;
        
        // Generate certificate ID if it doesn't exist
        if (!enrollment.certificateUrl) {
          try {
            const certId = await generateCourseCertificate(
              student._id.toString(),
              course._id.toString(),
              enrollment.completedAt
            );
            enrollment.certificateUrl = certId;
            await enrollment.save();
          } catch (err) {
            console.error("Failed to generate certificate:", err);
          }
        }

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

