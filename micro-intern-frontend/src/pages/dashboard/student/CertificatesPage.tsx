import { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./css/BrowsePage.css";

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

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
    try {
      setLoading(true);
      setError("");
      const coursesRes = await apiGet<{ success: boolean; data: any[] }>("/shop/my-courses");
      if (coursesRes.success) {
        const completedCourses = coursesRes.data.filter(
          (enrollment: any) => enrollment.completedAt
        );

        // Build certificates from completed enrollments
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
          // We'll still show it but mark as potentially invalid
          if (!certificateId) {
            certificateId = `enrollment-${enrollment._id}`;
          }

          return {
            certificateId: certificateId,
            student: {
              name: user?.name || "",
              email: user?.email || "",
            },
            course: {
              title: course.title || "Unknown Course",
              description: course.description,
            },
            completedAt: enrollment.completedAt,
            valid: !!enrollment.certificateUrl && certificateId.startsWith("CERT-"), // Valid if certificateUrl exists and has proper format
          };
        });

        setCertificates(certificates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }

  function downloadCertificate(certificateId: string) {
    // Only download if it's a valid CERT- format, otherwise show error
    if (certificateId.startsWith("CERT-")) {
      // Use relative URL - the API proxy should handle it
      const url = `/api/certificates/${certificateId}/html`;
      window.open(url, "_blank");
    } else {
      alert("Certificate not available. The certificate may still be processing.");
    }
  }

  async function downloadCertificateAsPDF(certificateId: string, courseTitle: string) {
    if (!certificateId.startsWith("CERT-")) {
      alert("Certificate not available. The certificate may still be processing.");
      return;
    }

    setGeneratingPDF(certificateId);

    try {
      // Fetch the certificate HTML
      const response = await fetch(`/api/certificates/${certificateId}/html`);
      if (!response.ok) {
        throw new Error("Failed to fetch certificate");
      }

      const htmlContent = await response.text();

      // Create a temporary iframe to render the HTML
      const iframe = document.createElement("iframe");
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.width = "800px";
      iframe.style.height = "600px";
      iframe.style.border = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Failed to create iframe");
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for images to load
      await new Promise((resolve) => {
        const images = iframeDoc.querySelectorAll("img");
        let loadedCount = 0;
        const totalImages = images.length;

        if (totalImages === 0) {
          setTimeout(resolve, 1000); // Wait a bit for rendering
          return;
        }

        const timeout = setTimeout(() => {
          resolve(undefined); // Resolve after 5 seconds even if images don't load
        }, 5000);

        images.forEach((img) => {
          if (img.complete) {
            loadedCount++;
            if (loadedCount === totalImages) {
              clearTimeout(timeout);
              resolve(undefined);
            }
          } else {
            img.onload = () => {
              loadedCount++;
              if (loadedCount === totalImages) {
                clearTimeout(timeout);
                resolve(undefined);
              }
            };
            img.onerror = () => {
              loadedCount++;
              if (loadedCount === totalImages) {
                clearTimeout(timeout);
                resolve(undefined);
              }
            };
          }
        });
      });

      // Wait a bit more for full rendering
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get the certificate element
      const certificateElement = iframeDoc.querySelector(".certificate") || iframeDoc.body;

      // Convert to canvas
      const canvas = await html2canvas(certificateElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
      });

      // Remove iframe
      document.body.removeChild(iframe);

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Download PDF
      const fileName = `Certificate_${courseTitle.replace(/[^a-z0-9]/gi, "_")}_${certificateId}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try downloading as HTML instead.");
    } finally {
      setGeneratingPDF(null);
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
            <div className="browse-eyebrow">My Certificates</div>
            <h1 className="browse-title">View and download your course completion certificates</h1>
            <p className="browse-subtitle">Showcase your achievements and completed courses</p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Total</div>
              <div className="browse-stat-value">{certificates.length}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && <div className="browse-alert" style={{ marginTop: "16px" }}>{error}</div>}

        {/* Certificates List */}
        {certificates.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No Certificates Yet</div>
              <div className="browse-empty-sub">Complete courses to earn certificates.</div>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Certificates</h2>
              <div className="browse-results-count">{certificates.length} earned</div>
            </div>
            <div className="browse-cards">
              {certificates.map((cert) => (
                <article key={cert.certificateId} className="job-card">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
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
                        <div className="job-sub" style={{ marginBottom: "12px", lineClamp: 2, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {cert.course.description}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
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
                      <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                        <button
                          onClick={() => downloadCertificate(cert.certificateId)}
                          className="browse-btn browse-btn--ghost"
                          style={{ flex: 1, fontSize: "12px", padding: "8px 12px" }}
                          disabled={generatingPDF === cert.certificateId}
                        >
                          View HTML
                        </button>
                        <button
                          onClick={() => downloadCertificateAsPDF(cert.certificateId, cert.course.title)}
                          className="browse-btn browse-btn--primary"
                          style={{ 
                            flex: 1, 
                            fontSize: "12px", 
                            padding: "8px 12px",
                            opacity: generatingPDF === cert.certificateId ? 0.6 : 1,
                            cursor: generatingPDF === cert.certificateId ? "wait" : "pointer"
                          }}
                          disabled={generatingPDF === cert.certificateId}
                        >
                          {generatingPDF === cert.certificateId ? "Generating..." : "Download PDF"}
                        </button>
                      </div>
                    </div>
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
