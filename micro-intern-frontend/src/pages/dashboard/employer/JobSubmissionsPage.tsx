import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "../student/css/BrowsePage.css";

type Submission = {
  _id: string;
  title: string;
  gold: number;
  submissionStatus: "submitted" | "confirmed" | "rejected" | "disputed";
  submissionReport?: {
    timeTaken?: number;
    completionNotes?: string;
    submittedAt?: string;
  };
  submissionProofUrl?: string;
  acceptedStudentId?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

export default function JobSubmissionsPage() {
  const { refreshUser } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<{ success: boolean; data: Submission[] }>("/jobs/submissions");
      if (res.success) setSubmissions(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(jobId: string) {
    if (!confirm("Confirm this submission and release payment to the student?")) return;

    try {
      setConfirming(jobId);
      const res = await apiPost<{
        success: boolean;
        data: any;
        goldAwarded?: number;
        studentNewBalance?: number;
      }>(`/jobs/${jobId}/confirm`, {});

      if (res.success) {
        const message = res.goldAwarded
          ? `Submission confirmed! ${res.goldAwarded} gold released to student.`
          : "Submission confirmed! Payment released to student.";
        alert(message);
        await loadSubmissions();
        await refreshUser();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to confirm submission";
      console.error("Confirm error:", err);
      alert(errorMessage);
    } finally {
      setConfirming(null);
    }
  }

  async function handleReject(jobId: string) {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      alert("Rejection reason must be at least 10 characters long.");
      return;
    }

    try {
      setRejecting(jobId);
      await apiPost(`/jobs/${jobId}/reject`, { reason: rejectReason.trim() });
      alert("Submission rejected. Student has been notified.");
      setShowRejectModal(null);
      setRejectReason("");
      await loadSubmissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject submission");
    } finally {
      setRejecting(null);
    }
  }

  function getStatusBadge(status: Submission["submissionStatus"]) {
    const badges = {
      submitted: {
        bg: "rgba(59,130,246,.16)",
        border: "rgba(59,130,246,.35)",
        color: "rgba(59,130,246,.9)",
        text: "Submitted",
      },
      confirmed: {
        bg: "rgba(34,197,94,.16)",
        border: "rgba(34,197,94,.35)",
        color: "rgba(34,197,94,.9)",
        text: "Confirmed",
      },
      rejected: {
        bg: "rgba(239,68,68,.16)",
        border: "rgba(239,68,68,.35)",
        color: "rgba(239,68,68,.9)",
        text: "Rejected",
      },
      disputed: {
        bg: "rgba(251,191,36,.16)",
        border: "rgba(251,191,36,.35)",
        color: "rgba(251,191,36,.9)",
        text: "Disputed",
      },
    };
    return badges[status];
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading submissions…</div>
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
            <div className="browse-eyebrow">Job Submissions</div>
            <h1 className="browse-title">Review Submissions</h1>
            <p className="browse-subtitle">Review and confirm or reject student submissions</p>
          </div>
        </header>

        {/* Error */}
        {error && (
          <section className="browse-panel" style={{ marginTop: "16px", borderColor: "rgba(239,68,68,.5)", background: "rgba(239,68,68,.1)" }}>
            <div style={{ color: "rgba(239,68,68,.9)", fontSize: "14px" }}>{error}</div>
          </section>
        )}

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No Submissions</div>
              <div className="browse-empty-sub">No jobs have been submitted for review yet.</div>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Submissions</h2>
              <div className="browse-results-count">{submissions.length} found</div>
            </div>
            <div className="browse-cards">
              {submissions.map((sub) => {
                const badge = getStatusBadge(sub.submissionStatus);
                return (
                  <article key={sub._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main" style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
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
                            {sub.title.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="job-title" style={{ marginBottom: "4px" }}>
                              {sub.title}
                            </div>
                            {sub.acceptedStudentId && (
                              <div className="job-sub">
                                Submitted by: {sub.acceptedStudentId.name} ({sub.acceptedStudentId.email})
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                          <span
                            className="badge"
                            style={{
                              background: "rgba(255,255,255,.1)",
                              borderColor: "rgba(255,255,255,.2)",
                              color: "var(--text)",
                            }}
                          >
                            {sub.gold} Gold
                          </span>
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
                          {sub.submissionReport?.submittedAt && (
                            <span
                              className="badge"
                              style={{
                                background: "rgba(255,255,255,.06)",
                                borderColor: "rgba(255,255,255,.12)",
                                color: "var(--muted)",
                                fontSize: "11px",
                              }}
                            >
                              Submitted: {new Date(sub.submissionReport.submittedAt).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Submission Report */}
                        {sub.submissionReport && (
                          <div
                            style={{
                              marginTop: "12px",
                              padding: "12px",
                              background: "rgba(255,255,255,.04)",
                              border: "1px solid rgba(255,255,255,.08)",
                              borderRadius: "12px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "var(--muted)",
                                marginBottom: "8px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              Completion Report
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: "1.6" }}>
                              {sub.submissionReport.timeTaken && (
                                <div style={{ marginBottom: "6px" }}>
                                  <strong>Time Taken:</strong> {sub.submissionReport.timeTaken} hours
                                </div>
                              )}
                              {sub.submissionReport.completionNotes && (
                                <div>
                                  <strong>Notes:</strong> {sub.submissionReport.completionNotes}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Proof URL */}
                        {sub.submissionProofUrl && (
                          <div style={{ marginTop: "12px" }}>
                            <a
                              href={sub.submissionProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="browse-link"
                              style={{ fontSize: "13px" }}
                            >
                              View Proof Document →
                            </a>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {sub.submissionStatus === "rejected" && sub.rejectionReason && (
                          <div
                            style={{
                              marginTop: "12px",
                              padding: "12px",
                              background: "rgba(239,68,68,.1)",
                              border: "1px solid rgba(239,68,68,.3)",
                              borderRadius: "12px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "rgba(239,68,68,.9)",
                                marginBottom: "6px",
                              }}
                            >
                              Rejection Reason
                            </div>
                            <div style={{ fontSize: "13px", color: "rgba(239,68,68,.9)" }}>
                              {sub.rejectionReason}
                            </div>
                          </div>
                        )}
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
                        {sub.submissionStatus === "submitted" ? "Awaiting review" : sub.submissionStatus}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {sub.submissionStatus === "submitted" && (
                          <>
                            <button
                              onClick={() => handleConfirm(sub._id)}
                              disabled={confirming === sub._id}
                              className="browse-btn browse-btn--primary"
                              style={{
                                background: "rgba(34,197,94,.2)",
                                borderColor: "rgba(34,197,94,.5)",
                                color: "rgba(34,197,94,.9)",
                                minWidth: "140px",
                              }}
                            >
                              {confirming === sub._id ? "Confirming..." : "Confirm & Pay"}
                            </button>
                            <button
                              onClick={() => setShowRejectModal(sub._id)}
                              disabled={rejecting === sub._id}
                              className="browse-btn browse-btn--ghost"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {sub.submissionStatus === "confirmed" && (
                          <span
                            className="badge"
                            style={{
                              background: badge.bg,
                              borderColor: badge.border,
                              color: badge.color,
                              padding: "8px 16px",
                            }}
                          >
                            Confirmed ✓
                          </span>
                        )}
                        {sub.submissionStatus === "disputed" && (
                          <Link
                            to={`/dashboard/employer/messages?taskId=${sub._id}`}
                            className="browse-btn browse-btn--primary"
                          >
                            View Dispute →
                          </Link>
                        )}
                        <Link
                          to={`/dashboard/employer/messages?taskId=${sub._id}`}
                          className="browse-btn browse-btn--ghost"
                        >
                          Messages →
                        </Link>
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
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
            onClick={() => {
              setShowRejectModal(null);
              setRejectReason("");
            }}
          >
            <div
              className="browse-panel"
              style={{
                maxWidth: "500px",
                width: "100%",
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
                padding: "24px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "var(--text)",
                }}
              >
                Reject Submission
              </h2>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "13px",
                  color: "var(--muted)",
                  lineHeight: "1.5",
                }}
              >
                Please provide a detailed reason for rejection (minimum 10 characters). This reason will be sent to the student.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px",
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  color: "var(--text)",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  marginBottom: "16px",
                }}
                rows={4}
                placeholder="Enter rejection reason..."
              />
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
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
                  disabled={
                    rejecting === showRejectModal || !rejectReason.trim() || rejectReason.trim().length < 10
                  }
                  className="browse-btn"
                  style={{
                    background: "rgba(239,68,68,.2)",
                    borderColor: "rgba(239,68,68,.5)",
                    color: "rgba(239,68,68,.9)",
                    opacity: rejecting === showRejectModal || !rejectReason.trim() || rejectReason.trim().length < 10 ? 0.5 : 1,
                  }}
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
