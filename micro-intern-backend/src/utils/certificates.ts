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

  // Use provided completedAt or get from enrollment
  let completionDate = completedAt;
  if (!completionDate) {
    const enrollment = await StudentCourse.findOne({
      studentId: student._id,
      courseId: course._id,
    });
    completionDate = enrollment?.completedAt || new Date();
  }

  // Generate unique certificate ID
  const certificateData = {
    studentId: student._id.toString(),
    studentName: student.name,
    courseId: course._id.toString(),
    courseTitle: course.title,
    completedAt: completionDate.toISOString(),
  };

  // Create a hash for verification
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(certificateData))
    .digest("hex")
    .substring(0, 16);

  const certificateId = `CERT-${student._id.toString().substring(0, 8)}-${course._id.toString().substring(0, 8)}-${hash}`;

  // Return just the certificate ID (not the full URL)
  // The frontend will construct the URL when needed
  return certificateId;
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

    // Find enrollment by matching prefixes
    const enrollments = await StudentCourse.find({
      completedAt: { $exists: true },
    })
      .populate("studentId")
      .populate("courseId");

    for (const enrollment of enrollments) {
      const student = enrollment.studentId as any;
      const course = enrollment.courseId as any;

      if (
        student._id.toString().startsWith(studentIdPrefix) &&
        course._id.toString().startsWith(courseIdPrefix)
      ) {
        // Verify hash
        const certificateData = {
          studentId: student._id.toString(),
          studentName: student.name,
          courseId: course._id.toString(),
          courseTitle: course.title,
          completedAt: enrollment.completedAt?.toISOString(),
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
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }
    body {
      font-family: 'Times New Roman', serif;
      margin: 0;
      padding: 80px 100px;
      background: #f5f5f5;
      color: #1a1a1a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .certificate {
      background: white;
      padding: 80px 100px;
      border: 12px solid #d4af37;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      width: 100%;
      max-width: 1000px;
      position: relative;
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 2px solid #d4af37;
      pointer-events: none;
    }
    .certificate-header {
      margin-bottom: 50px;
    }
    .certificate h1 {
      font-size: 52px;
      margin: 0 0 20px 0;
      color: #1a1a1a;
      font-weight: bold;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .certificate h2 {
      font-size: 28px;
      margin: 30px 0;
      color: #333;
      font-weight: normal;
      font-style: italic;
    }
    .certificate p {
      font-size: 20px;
      line-height: 2;
      margin: 25px 0;
      color: #444;
    }
    .name-line {
      display: inline-block;
      min-width: 400px;
      border-bottom: 3px solid #1a1a1a;
      padding-bottom: 8px;
      margin: 20px 0;
      font-size: 32px;
      font-weight: bold;
      color: #1a1a1a;
    }
    .course-line {
      display: inline-block;
      min-width: 500px;
      border-bottom: 3px solid #1a1a1a;
      padding-bottom: 8px;
      margin: 20px 0;
      font-size: 24px;
      font-weight: bold;
      color: #1a1a1a;
    }
    .date {
      font-size: 18px;
      color: #666;
      margin-top: 50px;
      font-style: italic;
    }
    .certificate-id {
      font-size: 11px;
      color: #999;
      margin-top: 40px;
      font-family: 'Courier New', monospace;
      letter-spacing: 1px;
    }
    .signature-section {
      margin-top: 60px;
      display: flex;
      justify-content: space-around;
      padding-top: 40px;
    }
    .signature {
      width: 200px;
    }
    .signature-line {
      border-top: 2px solid #1a1a1a;
      margin-top: 60px;
      padding-top: 10px;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="certificate-header">
      <h1>Certificate of Completion</h1>
    </div>
    <p>This is to certify that</p>
    <div class="name-line">${studentName}</div>
    <p>has successfully completed the course</p>
    <div class="course-line">${courseTitle}</div>
    <p class="date">Completed on ${completedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <div class="signature-section">
      <div class="signature">
        <div class="signature-line">Authorized Signature</div>
      </div>
      <div class="signature">
        <div class="signature-line">Date</div>
      </div>
    </div>
    <div class="certificate-id">Certificate ID: ${certificateId}</div>
  </div>
</body>
</html>
  `;
}

