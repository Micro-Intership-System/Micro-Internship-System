import { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/BrowsePage.css";

type Certificate = {
  certificateId: string;
  enrollmentId: string;
  course: {
    _id: string;
    title: string;
    description?: string;
    category?: string;
  };
  completedAt: Date;
  valid: boolean;
};

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
    try {
      setLoading(true);
      setError("");
      // Get enrolled courses and filter completed ones
      const coursesRes = await apiGet<{ success: boolean; data: any[] }>("/shop/my-courses");
      if (coursesRes.success) {
        const completedCourses = coursesRes.data.filter(
          (enrollment: any) => enrollment.completedAt && enrollment.certificateUrl
        );

        // Build certificate data from enrollments
        const certs: Certificate[] = completedCourses.map((enrollment: any) => {
          const course = enrollment.courseId as any;
          // Extract certificate ID - it should be just the ID now, not a full URL
          let certId = enrollment.certificateUrl || enrollment._id;
          // If it's a URL, extract the ID part
          if (certId.includes('/')) {
            certId = certId.split('/').pop() || certId;
          }
          // Remove any query params or fragments
          certId = certId.split('?')[0].split('#')[0];
          
          return {
            certificateId: certId,
            enrollmentId: enrollment._id,
            course: {
              _id: course._id || course._id,
              title: course.title,
              description: course.description,
              category: course.category,
            },
            completedAt: new Date(enrollment.completedAt),
            valid: true,
          };
        });

        setCertificates(certs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }

  async function downloadCertificate(certificateId: string) {
    try {
      // Open certificate HTML in new window for printing/downloading
      const url = `/api/certificates/${certificateId}/html`;
      const win = window.open(url, "_blank");
      if (win) {
        // Wait for window to load, then trigger print
        setTimeout(() => {
          win.print();
        }, 500);
      }
    } catch (err) {
      console.error("Failed to download certificate:", err);
      alert("Failed to download certificate. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading certificates…</div>
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
            <div className="browse-eyebrow">Course Certificates</div>
            <h1 className="browse-title">Your Completed Courses</h1>
            <p className="browse-subtitle">
              Download PDF certificates for courses you've successfully completed.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Certificates</div>
              <div className="browse-stat-value">{certificates.length}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="browse-alert" style={{ marginTop: "16px" }}>
            {error}
          </div>
        )}

        {/* Certificates List */}
        {certificates.length === 0 ? (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>
                No Certificates Yet
              </h3>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                Complete courses to earn certificates.
              </p>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Your Certificates</h2>
              <div className="browse-results-count">{certificates.length} found</div>
            </div>

            <div className="browse-cards">
              {certificates.map((cert) => (
                <article key={cert.certificateId} className="job-card">
                  <div className="job-card-top">
                    <div className="job-card-main">
                      <div className="job-title">{cert.course.title}</div>
                      <div className="job-sub">
                        {cert.course.category || "Course"} · Completed {cert.completedAt.toLocaleDateString()}
                      </div>
                    </div>
                    <div className="job-badges">
                      <span className="badge badge--gold">Certificate</span>
                    </div>
                  </div>

                  {cert.course.description && (
                    <div style={{ marginTop: "12px", color: "var(--muted)", fontSize: "13px", lineHeight: "1.5" }}>
                      {cert.course.description}
                    </div>
                  )}

                  <div className="job-card-bottom">
                    <div className="job-meta">
                      <span className="meta-dot" />
                      Valid Certificate
                      <span className="meta-dot" />
                      PDF Download
                    </div>
                    <button
                      className="browse-btn browse-btn--primary"
                      onClick={() => downloadCertificate(cert.certificateId)}
                    >
                      Download PDF →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
