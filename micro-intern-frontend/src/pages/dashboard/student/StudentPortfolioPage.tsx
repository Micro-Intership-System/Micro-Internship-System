import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiGet } from "../../../api/client";
import "./css/BrowsePage.css";

type Props = {
  readonly?: boolean;
  studentId?: string;
};

type Certificate = {
  certificateId: string;
  student: {
    name: string;
    email: string;
  };
  course: {
    title: string;
    description?: string;
  };
  completedAt: string;
  valid: boolean;
};

export default function StudentPortfolioPage({
  readonly = false,
  studentId,
}: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [studentData, setStudentData] = useState<any>(null);

  const displayStudentId = studentId || user?.id;

  useEffect(() => {
    if (displayStudentId) {
      loadPortfolio();
      loadCertificates();
    }
  }, [displayStudentId]);

  async function loadPortfolio() {
    try {
      setLoading(true);
      
      // If viewing another student's portfolio, fetch their data
      if (studentId && studentId !== user?.id) {
        const studentRes = await apiGet<{ success: boolean; data: any }>(`/student/${studentId}`);
        if (studentRes.success) {
          const student = studentRes.data;
          setStudentData(student);
          setPortfolioData({
            name: student.name || "Student",
            email: student.email || "",
            institution: student.institution || "",
            bio: student.bio || "",
            profilePicture: student.profilePicture || "",
            starRating: student.starRating || 1,
            totalTasksCompleted: student.totalTasksCompleted || 0,
          });
        } else {
          setStudentData(null);
          setPortfolioData({
            name: "Student",
            email: "",
            institution: "",
            bio: "",
            profilePicture: "",
            starRating: 1,
            totalTasksCompleted: 0,
          });
        }
      } else {
        // Use logged-in user's data
        setStudentData(user);
        setPortfolioData({
          name: user?.name || "Student",
          email: user?.email || "",
          institution: (user as any)?.institution || "",
          bio: (user as any)?.bio || "",
          profilePicture: (user as any)?.profilePicture || "",
          starRating: (user as any)?.starRating || 1,
          totalTasksCompleted: (user as any)?.totalTasksCompleted || 0,
        });
      }
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCertificates() {
    try {
      // If viewing another student's portfolio, fetch their courses
      let coursesRes;
      if (studentId && studentId !== user?.id) {
        coursesRes = await apiGet<{ success: boolean; data: any[] }>(`/shop/student/${studentId}/courses`);
      } else {
        coursesRes = await apiGet<{ success: boolean; data: any[] }>("/shop/my-courses");
      }
      
      if (coursesRes.success) {
        const completedCourses = coursesRes.data.filter(
          (enrollment: any) => enrollment.completedAt
        );

        // Build certificates from completed enrollments (same logic as CertificatesPage)
        const certificates: Certificate[] = completedCourses.map((enrollment: any) => {
          const course = enrollment.courseId || {};
          let certificateId = "";
          
          // Extract certificate ID from certificateUrl if it exists
          if (enrollment.certificateUrl) {
            // URL format: http://localhost:5173/certificates/CERT-xxx-xxx-xxx
            // or: /certificates/CERT-xxx-xxx-xxx
            const urlMatch = enrollment.certificateUrl.match(/certificates\/(CERT-[^\/\s]+)/);
            if (urlMatch && urlMatch[1]) {
              certificateId = urlMatch[1];
            } else {
              // Try splitting by /certificates/
              const urlParts = enrollment.certificateUrl.split("/certificates/");
              if (urlParts.length > 1) {
                certificateId = urlParts[1].split("/")[0].split("?")[0]; // Remove query params and path
              }
            }
          }
          
          // If still no certificateId, the course was completed but certificate generation might have failed
          if (!certificateId) {
            certificateId = `enrollment-${enrollment._id}`;
          }

          return {
            certificateId: certificateId,
            student: {
              name: studentData?.name || portfolioData?.name || user?.name || "",
              email: studentData?.email || portfolioData?.email || user?.email || "",
            },
            course: {
              title: course.title || "Unknown Course",
              description: course.description,
            },
            completedAt: enrollment.completedAt,
            valid: !!enrollment.certificateUrl && certificateId.startsWith("CERT-"),
          };
        });

        setCertificates(certificates);
      }
    } catch (err) {
      console.error("Failed to load certificates:", err);
    }
  }

  function downloadCertificate(certificateId: string) {
    window.open(`/api/certificates/${certificateId}/html`, "_blank");
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading portfolio…</div>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Portfolio not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="browse-inner">
        {/* Header */}
        <header className="browse-header">
          <div className="browse-title-wrap">
            <div className="browse-eyebrow">Student Portfolio</div>
            <h1 className="browse-title">
              {readonly ? "Student Portfolio" : "My Portfolio"}
            </h1>
            <p className="browse-subtitle">
              {readonly
                ? "View student profile and achievements"
                : "Showcase your accomplishments and certificates"}
            </p>
          </div>
        </header>

        {/* Profile Card */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
            {portfolioData.profilePicture ? (
              <img
                src={portfolioData.profilePicture}
                alt={portfolioData.name}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(124,58,237,.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "28px",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                {portfolioData.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: "900" }}>
                {portfolioData.name}
              </h2>
              {portfolioData.institution && (
                <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: "14px" }}>
                  {portfolioData.institution}
                </p>
              )}
              {portfolioData.bio && (
                <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,.85)", fontSize: "14px", lineHeight: "1.6" }}>
                  {portfolioData.bio}
                </p>
              )}

              {/* Stats */}
              <div style={{ display: "flex", gap: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,.12)" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                    Tasks Completed
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "800" }}>
                    {portfolioData.totalTasksCompleted || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Certificates Section */}
        <section className="browse-results" style={{ marginTop: "16px" }}>
          <div className="browse-results-head">
            <h2 className="browse-results-title">Certificates</h2>
            <div className="browse-results-count">{certificates.length} earned</div>
          </div>

          {certificates.length === 0 ? (
            <div className="browse-empty">
              <div className="browse-empty-title">No certificates yet</div>
              <div className="browse-empty-sub">Complete courses to earn certificates.</div>
            </div>
          ) : (
            <div className="browse-cards">
              {certificates.map((cert) => (
                <article key={cert.certificateId} className="job-card" style={{ cursor: "pointer" }} onClick={() => downloadCertificate(cert.certificateId)}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {/* Award Icon */}
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, rgba(124,58,237,.3), rgba(59,130,246,.2))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "rgba(255,255,255,.9)" }}
                      >
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                        <path d="M4 22h16"></path>
                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                      </svg>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="job-title" style={{ marginBottom: "6px" }}>
                        {cert.course.title}
                      </div>
                      {cert.course.description && (
                        <div className="job-sub" style={{ marginBottom: "8px", lineClamp: 2, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {cert.course.description}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            color: cert.valid ? "rgba(34,197,94,.9)" : "rgba(239,68,68,.9)",
                            fontWeight: "600",
                          }}
                        >
                          {cert.valid ? "✓ Valid" : "✗ Invalid"}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>•</span>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {new Date(cert.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Contact Info */}
        {!readonly && (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div className="browse-panel-head">
              <h2 className="browse-panel-title">Contact</h2>
            </div>
            <p style={{ margin: 0, color: "rgba(255,255,255,.85)", fontSize: "14px" }}>
              {portfolioData.email}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
