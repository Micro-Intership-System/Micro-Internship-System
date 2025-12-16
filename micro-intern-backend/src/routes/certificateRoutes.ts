import { Router } from "express";
import { verifyCertificate, generateCertificateHTML } from "../utils/certificates";

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
    const verification = await verifyCertificate(req.params.certificateId);

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

