import { StudentCourse } from "../models/studentCourse";
import { CourseShopItem } from "../models/courseShop";
import { User } from "../models/user";
import crypto from "crypto";

/**
 * Generate a certificate URL/ID for a completed course
 * In production, this would generate an actual PDF certificate
 * For now, we'll create a unique certificate ID that can be used to verify completion
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
    studentId: student._id.toString(),
    studentName: student.name,
    courseId: course._id.toString(),
    courseTitle: course.title,
    completedAt: completionDateISO,
  };

  // Create a hash for verification
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(certificateData))
    .digest("hex")
    .substring(0, 16);

  const certificateId = `CERT-${student._id.toString().substring(0, 8)}-${course._id.toString().substring(0, 8)}-${hash}`;

  // In production, you would:
  // 1. Generate a PDF certificate using a library like pdfkit or puppeteer
  // 2. Upload it to cloud storage (S3, Supabase, etc.)
  // 3. Return the public URL

  // For now, we'll return a URL that can be used to verify the certificate
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const certificateUrl = `${baseUrl}/certificates/${certificateId}`;

  return certificateUrl;
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

