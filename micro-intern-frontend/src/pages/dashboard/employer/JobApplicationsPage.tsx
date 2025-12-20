import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../../api/client";
import "../student/css/BrowsePage.css";

type ApplicationStatus = "evaluating" | "accepted" | "rejected" | "applied";

type Application = {
  _id: string;
  status: ApplicationStatus;
  studentId: {
    _id: string;
    name: string;
    email: string;
    institution?: string;
    skills?: string[];
    bio?: string;
    profilePicture?: string;
    starRating?: number;
    totalTasksCompleted?: number;
  };
  createdAt: string;
  rejectionReason?: string;
};

type Response = {
  success: boolean;
  data: Application[];
};

export default function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Job ID is missing");
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");
    
    apiGet<Response>(`/employer/jobs/${id}/applications`)
      .then(res => {
        if (!isMounted) return;
        if (res.success) {
          setApps(Array.isArray(res.data) ? res.data : []);
          setError("");
        } else {
          setError("Failed to load applications");
          setApps([]);
        }
      })
      .catch(err => {
        if (!isMounted) return;
        console.error("Error loading applications:", err);
        setError(err instanceof Error ? err.message : "Failed to load applications");
        setApps([]);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function updateStatus(
    appId: string,
    status: "accepted" | "rejected",
    rejectionReason?: string
  ) {
    try {
      const payload: any = { status };
      if (status === "rejected" && rejectionReason) {
        payload.rejectionReason = rejectionReason;
      }
      await apiPatch(`/employer/applications/${appId}/status`, payload);
      // Reload applications to get updated status
      const res = await apiGet<Response>(`/employer/jobs/${id}/applications`);
      if (res.success) setApps(res.data || []);
      setShowRejectModal(null);
      setRejectReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleReject(appId: string) {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      alert("Rejection reason must be at least 10 characters long.");
      return;
    }

    try {
      setRejecting(appId);
      await updateStatus(appId, "rejected", rejectReason.trim());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject application");
    } finally {
      setRejecting(null);
    }
  }

  function getStatusBadge(status: ApplicationStatus | string) {
    const badges: Record<string, { bg: string; border: string; color: string; text: string }> = {
      accepted: {
        bg: "rgba(34,197,94,.16)",
        border: "rgba(34,197,94,.35)",
        color: "rgba(34,197,94,.9)",
        text: "Accepted",
      },
      rejected: {
        bg: "rgba(239,68,68,.16)",
        border: "rgba(239,68,68,.35)",
        color: "rgba(239,68,68,.9)",
        text: "Rejected",
      },
      evaluating: {
        bg: "rgba(251,191,36,.16)",
        border: "rgba(251,191,36,.35)",
        color: "rgba(251,191,36,.9)",
        text: "Evaluating",
      },
      applied: {
        bg: "rgba(59,130,246,.16)",
        border: "rgba(59,130,246,.35)",
        color: "rgba(59,130,246,.9)",
        text: "Applied",
      },
    };
    return badges[status] || badges.evaluating;
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading applications…</div>
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Invalid job ID</div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page" style={{ minHeight: "100vh", background: "#0b1220" }}>
      <div className="browse-inner">
        {/* Header */}
        <header className="browse-header">
          <div className="browse-title-wrap">
            <div className="browse-eyebrow">Job Applications</div>
            <h1 className="browse-title">Review Applications</h1>
            <p className="browse-subtitle">Review and manage applications for this job posting</p>
          </div>
        </header>

        {/* Error */}
        {error && (
          <section className="browse-panel" style={{ marginTop: "16px", borderColor: "rgba(239,68,68,.5)", background: "rgba(239,68,68,.1)" }}>
            <div style={{ color: "rgba(239,68,68,.9)", fontSize: "14px" }}>{error}</div>
          </section>
        )}

        {/* Applications List */}
        {apps.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No Applications Yet</div>
              <div className="browse-empty-sub">No applications have been submitted for this job posting.</div>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Applications</h2>
              <div className="browse-results-count">{apps.length} found</div>
            </div>
            <div className="browse-cards">
              {apps.map((app) => {
                if (!app || !app.studentId) {
                  return null;
                }
                const badge = getStatusBadge(app.status);
                return (
                  <article key={app._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main" style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                          {app.studentId.profilePicture ? (
                            <img
                              src={app.studentId.profilePicture}
                              alt={app.studentId.name || "Student"}
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, rgba(124,58,237,.5), rgba(59,130,246,.4))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "18px",
                                fontWeight: "bold",
                                flexShrink: 0,
                              }}
                            >
                              {(app.studentId.name || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="job-title" style={{ marginBottom: "4px" }}>
                              {app.studentId.name || "Unknown Student"}
                            </div>
                            <div className="job-sub">
                              {app.studentId.email || "No email"}
                              {app.studentId.institution && ` · ${app.studentId.institution}`}
                            </div>
                          </div>
                        </div>

                        {app.studentId.bio && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--muted)",
                              lineHeight: "1.5",
                              marginBottom: "12px",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {app.studentId.bio}
                          </p>
                        )}

                        {app.studentId.skills && app.studentId.skills.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                            {app.studentId.skills.slice(0, 5).map((skill, i) => (
                              <span
                                key={i}
                                className="badge"
                                style={{
                                  background: "rgba(255,255,255,.06)",
                                  borderColor: "rgba(255,255,255,.12)",
                                  color: "var(--muted)",
                                  fontSize: "11px",
                                  padding: "4px 8px",
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                          {app.studentId.starRating !== undefined && app.studentId.starRating !== null && (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  width="12"
                                  height="12"
                                  viewBox="0 0 20 20"
                                  fill={star <= (app.studentId.starRating || 0) ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.15)"}
                                  style={{ flexShrink: 0 }}
                                >
                                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                              ))}
                              <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "4px" }}>
                                {(app.studentId.starRating || 0).toFixed(1)} · {app.studentId.totalTasksCompleted || 0} tasks
                              </span>
                            </div>
                          )}
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                            Applied {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Unknown date"}
                          </span>
                        </div>
                      </div>
                      <div className="job-badges">
                        <span
                          className="badge"
                          style={{
                            background: badge.bg,
                            borderColor: badge.border,
                            color: badge.color,
                          }}
                        >
                          {badge.text}
                        </span>
                      </div>
                    </div>
                    <div className="job-card-bottom">
                      <div className="job-meta">
                        <span className="meta-dot" />
                        Application submitted
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {(app.status === "evaluating" || app.status === "applied") && (
                          <>
                            <button
                              onClick={() => updateStatus(app._id, "accepted")}
                              className="browse-btn browse-btn--primary"
                              style={{ minWidth: "100px" }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => setShowRejectModal(app._id)}
                              className="browse-btn browse-btn--ghost"
                              style={{ minWidth: "100px" }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {app.status === "accepted" && (
                          <>
                            <span
                              className="badge"
                              style={{
                                background: badge.bg,
                                borderColor: badge.border,
                                color: badge.color,
                                padding: "8px 16px",
                              }}
                            >
                              Accepted
                            </span>
                            <Link
                              to={`/dashboard/employer/messages?taskId=${id}`}
                              className="browse-btn browse-btn--primary"
                            >
                              Chat →
                            </Link>
                          </>
                        )}
                        {app.status === "rejected" && (
                          <>
                            <span
                              className="badge"
                              style={{
                                background: badge.bg,
                                borderColor: badge.border,
                                color: badge.color,
                                padding: "8px 16px",
                              }}
                            >
                              Rejected
                            </span>
                            {app.rejectionReason && (
                              <div style={{ width: "100%", marginTop: "12px", padding: "12px", background: "rgba(239,68,68,.1)", borderRadius: "8px", border: "1px solid rgba(239,68,68,.3)" }}>
                                <div style={{ fontSize: "12px", fontWeight: "600", color: "rgba(239,68,68,.9)", marginBottom: "4px" }}>Rejection Reason:</div>
                                <div style={{ fontSize: "13px", color: "rgba(239,68,68,.8)" }}>{app.rejectionReason}</div>
                              </div>
                            )}
                          </>
                        )}
                        {app.studentId._id && (
                          <Link
                            to={`/dashboard/employer/students/${app.studentId._id}`}
                            className="browse-btn browse-btn--ghost"
                          >
                            View Portfolio →
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="browse-modal-overlay" style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div className="browse-modal" style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
            }}>
              <h2 style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: "800" }}>Reject Application</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "16px" }}>
                Please provide a detailed reason for rejection (minimum 10 characters). This reason will be sent to the student.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="browse-input"
                rows={4}
                placeholder="Enter rejection reason..."
                style={{ width: "100%", marginBottom: "16px", minHeight: "100px" }}
              />
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason("");
                  }}
                  className="browse-btn browse-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={rejecting === showRejectModal || !rejectReason.trim() || rejectReason.trim().length < 10}
                  className="browse-btn browse-btn--danger"
                  style={{ opacity: (rejecting === showRejectModal || !rejectReason.trim() || rejectReason.trim().length < 10) ? 0.5 : 1 }}
                >
                  {rejecting === showRejectModal ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
