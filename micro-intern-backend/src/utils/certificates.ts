import { StudentCourse } from "../models/studentCourse";
import { CourseShopItem } from "../models/courseShop";
import { User } from "../models/user";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import { uploadPDF } from "./storage";

/**
 * Generate a certificate URL/ID for a completed course
 * Generates a PDF certificate and uploads it to Supabase Storage
 */
export async function generateCourseCertificate(
  studentId: string,
  courseId: string,
  completedAt?: Date
): Promise<string> {
  const student = await User.findById(studentId);
  const course = await CourseShopItem.findById(courseId);

  if (!student || !course) {
    throw new Error("Student or course not found");
  }

  // Use provided completedAt or current date
  const completionDate = completedAt || new Date();
  const completionDateISO = completionDate.toISOString();

  // Generate unique certificate ID
  const certificateData = {
    studentId: String(student._id),
    studentName: student.name,
    courseId: String(course._id),
    courseTitle: course.title,
    completedAt: completionDateISO,
  };

  // Create a hash for verification
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(certificateData))
    .digest("hex")
    .substring(0, 16);

  const certificateId = `CERT-${String(student._id).substring(0, 8)}-${String(course._id).substring(0, 8)}-${hash}`;

  // Generate PDF certificate
  const pdfBuffer = await generateCertificatePDF(
    student.name,
    course.title,
    completionDate,
    certificateId
  );

  // Upload to Supabase Storage
  const filename = `${certificateId}.pdf`;
  const uploadResult = await uploadPDF(pdfBuffer, "certificates", filename);

  if (!uploadResult.success || !uploadResult.url) {
    console.error("Failed to upload certificate to Supabase:", uploadResult.error);
    // Fallback to URL-based certificate if upload fails
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return `${baseUrl}/certificates/${certificateId}`;
  }

  return uploadResult.url;
}

/**
 * Generate a PDF certificate using PDFKit
 */
async function generateCertificatePDF(
  studentName: string,
  courseTitle: string,
  completedAt: Date,
  certificateId: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", (err) => {
        reject(err);
      });

      // Background gradient effect (simulated with rectangles)
      doc.rect(0, 0, doc.page.width, doc.page.height).fillColor("#667eea").fill();

      // White certificate area
      const margin = 50;
      doc
        .rect(margin, margin, doc.page.width - margin * 2, doc.page.height - margin * 2)
        .fillColor("#ffffff")
        .fill();

      // Title
      doc
        .fontSize(48)
        .fillColor("#667eea")
        .font("Helvetica-Bold")
        .text("CERTIFICATE OF COMPLETION", margin + 50, 150, {
          align: "center",
          width: doc.page.width - (margin + 50) * 2,
        });

      // Body text
      doc
        .fontSize(18)
        .fillColor("#333333")
        .font("Helvetica")
        .text("This is to certify that", margin + 50, 250, {
          align: "center",
          width: doc.page.width - (margin + 50) * 2,
        });

      // Student name
      doc
        .fontSize(36)
        .fillColor("#667eea")
        .font("Helvetica-Bold")
        .text(studentName, margin + 50, 300, {
          align: "center",
          width: doc.page.width - (margin + 50) * 2,
        });

      // Course completion text
      doc
        .fontSize(18)
        .fillColor("#333333")
        .font("Helvetica")
        .text("has successfully completed the course", margin + 50, 380, {
          align: "center",
          width: doc.page.width - (margin + 50) * 2,
        });

      // Course title
      doc
        .fontSize(24)
        .fillColor("#333333")
        .font("Helvetica-Bold")
        .text(courseTitle, margin + 50, 430, {
          align: "center",
          width: doc.page.width - (margin + 50) * 2,
        });

      // Date
      const dateStr = completedAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc
        .fontSize(14)
        .fillColor("#666666")
        .font("Helvetica")
        .text(`Completed on ${dateStr}`, margin + 50, 520, {
          align: "center",
          width: doc.page.width - (margin + 50) * 2,
        });

      // Certificate ID (small, at bottom)
      doc
        .fontSize(10)
        .fillColor("#cccccc")
        .font("Courier")
        .text(`Certificate ID: ${certificateId}`, margin + 50, doc.page.height - 100, {
          align: "center",
          width: doc.page.width - (margin + 50) * 2,
        });

      // Signature line (optional)
      doc
        .fontSize(12)
        .fillColor("#333333")
        .font("Helvetica")
        .text("Authorized Signature", doc.page.width - 200, doc.page.height - 150);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Verify a certificate ID
 */
export async function verifyCertificate(certificateId: string): Promise<{
  valid: boolean;
  student?: any;
  course?: any;
  completedAt?: Date;
}> {
  try {
    // Parse certificate ID format: CERT-{studentId}-{courseId}-{hash}
    const parts = certificateId.replace("CERT-", "").split("-");
    if (parts.length !== 3) {
      return { valid: false };
    }

    const [studentIdPrefix, courseIdPrefix, hash] = parts;

    // Find enrollment by matching prefixes - more efficient query
    const enrollments = await StudentCourse.find({
      completedAt: { $exists: true },
    })
      .populate("studentId")
      .populate("courseId");

    for (const enrollment of enrollments) {
      const student = enrollment.studentId as any;
      const course = enrollment.courseId as any;

      if (!student || !course || !enrollment.completedAt) {
        continue;
      }

      const studentIdStr = student._id.toString();
      const courseIdStr = course._id.toString();

      if (
        studentIdStr.startsWith(studentIdPrefix) &&
        courseIdStr.startsWith(courseIdPrefix)
      ) {
        // Verify hash - use the exact completedAt from enrollment
        const completedAtISO = enrollment.completedAt.toISOString();
        const certificateData = {
          studentId: studentIdStr,
          studentName: student.name,
          courseId: courseIdStr,
          courseTitle: course.title,
          completedAt: completedAtISO,
        };

        const expectedHash = crypto
          .createHash("sha256")
          .update(JSON.stringify(certificateData))
          .digest("hex")
          .substring(0, 16);

        if (hash === expectedHash) {
          return {
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

    return { valid: false };
  } catch (err) {
    console.error("Certificate verification error:", err);
    return { valid: false };
  }
}

/**
 * Generate certificate HTML (for PDF generation in production)
 */
export function generateCertificateHTML(
  studentName: string,
  courseTitle: string,
  completedAt: Date,
  certificateId: string
): string {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const signatureUrl = `${frontendUrl}/sign.png`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Georgia', serif;
      margin: 0;
      padding: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
    }
    .certificate {
      background: white;
      padding: 60px;
      border: 8px solid #667eea;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
      position: relative;
      min-height: 600px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .certificate-content {
      flex: 1;
    }
    .certificate h1 {
      font-size: 48px;
      margin: 20px 0;
      color: #667eea;
      font-weight: bold;
    }
    .certificate h2 {
      font-size: 32px;
      margin: 30px 0;
      color: #333;
      font-weight: normal;
    }
    .certificate p {
      font-size: 18px;
      line-height: 1.8;
      margin: 20px 0;
      color: #666;
    }
    .student-name {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      margin: 20px 0;
    }
    .course-title {
      font-size: 24px;
      color: #333;
      margin: 20px 0;
    }
    .signature-section {
      margin-top: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .signature-image {
      max-width: 200px;
      height: auto;
    }
    .certificate-id {
      font-size: 12px;
      color: #ccc;
      margin-top: 40px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="certificate-content">
      <h1>CERTIFICATE OF COMPLETION</h1>
      <p>This is to certify that</p>
      <div class="student-name">${studentName}</div>
      <p>has successfully completed the course</p>
      <div class="course-title">${courseTitle}</div>
    </div>
    <div class="signature-section">
      <img src="${signatureUrl}" alt="Authorized Signature" class="signature-image" />
    </div>
    <div class="certificate-id">Certificate ID: ${certificateId}</div>
  </div>
</body>
</html>
  `;
}

