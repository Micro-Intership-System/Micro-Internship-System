import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/BrowsePage.css";

type RunningJob = {
  _id: string;
  title: string;
  companyName: string;
  gold: number;
  deadline?: string;
  status: string;
  submissionStatus: "pending" | "submitted" | "confirmed" | "rejected" | "disputed";
  acceptedAt?: string;
  submissionReport?: {
    timeTaken?: number;
    completionNotes?: string;
    submittedAt?: string;
  };
  submissionProofUrl?: string;
  rejectionReason?: string;
};

export default function RunningJobsPage() {
  const { user, refreshUser } = useAuth();
  const [jobs, setJobs] = useState<RunningJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<string | null>(null);
  const [submitForm, setSubmitForm] = useState({
    proofUrl: "",
    timeTaken: "",
    completionNotes: "",
  });
  const [showReportModal, setShowReportModal] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<{ success: boolean; data: RunningJob[] }>("/jobs/running");
      if (res.success) {
        setJobs(res.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load running jobs");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(jobId: string) {
    try {
      setSubmitting(jobId);
      const payload: any = {};
      if (submitForm.proofUrl && submitForm.proofUrl.trim()) {
        payload.proofUrl = submitForm.proofUrl.trim();
      }
      if (submitForm.timeTaken && submitForm.timeTaken.trim()) {
        const timeValue = Number(submitForm.timeTaken.trim());
        if (!isNaN(timeValue) && timeValue >= 0) {
          payload.timeTaken = timeValue;
        }
      }
      if (submitForm.completionNotes && submitForm.completionNotes.trim()) {
        payload.completionNotes = submitForm.completionNotes.trim();
      }
      
      await apiPost(`/jobs/${jobId}/submit`, payload);
      setShowSubmitModal(null);
      setSubmitForm({ proofUrl: "", timeTaken: "", completionNotes: "" });
      await loadJobs();
      await refreshUser();
      alert("Job submitted successfully! The employer will review your submission.");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit job";
      console.error("Submit error:", err);
      alert(errorMessage);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCancel(jobId: string) {
    if (!confirm("Are you sure you want to cancel this job? This will deduct 50% of the job's gold value from your account (can go negative).")) {
      return;
    }

    try {
      setCancelling(jobId);
      const res = await apiPost<{ success: boolean; feeDeducted: number; newGoldBalance: number }>(`/jobs/${jobId}/cancel`, {});
      if (res.success) {
        alert(`Job cancelled. ${res.feeDeducted} gold deducted. Your new balance: ${res.newGoldBalance} gold.`);
        await loadJobs();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel job");
    } finally {
      setCancelling(null);
    }
  }

  async function handleReportRejection(jobId: string) {
    if (!confirm("Report this rejection as an anomaly? This will open a dispute chat with admin.")) {
      return;
    }

    try {
      await apiPost(`/jobs/${jobId}/report-rejection`, {});
      alert("Rejection reported. A dispute has been opened and admin will review.");
      await loadJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to report rejection");
    }
  }

  function getSubmissionStatusBadge(status: string) {
    const badges: Record<string, { text: string; style: React.CSSProperties }> = {
      pending: { text: "In Progress", style: { borderColor: "rgba(251,191,36,.35)", background: "rgba(251,191,36,.16)", color: "#fbbf24" } },
      submitted: { text: "Submitted", style: { borderColor: "rgba(59,130,246,.35)", background: "rgba(59,130,246,.16)", color: "#3b82f6" } },
      confirmed: { text: "Confirmed", style: { borderColor: "rgba(34,197,94,.35)", background: "rgba(34,197,94,.16)", color: "#22c55e" } },
      rejected: { text: "Rejected", style: { borderColor: "rgba(239,68,68,.35)", background: "rgba(239,68,68,.16)", color: "#ef4444" } },
      disputed: { text: "Disputed", style: { borderColor: "rgba(168,85,247,.35)", background: "rgba(168,85,247,.16)", color: "#a855f7" } },
    };
    return badges[status] || badges.pending;
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading running jobs…</div>
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
            <div className="browse-eyebrow">Active Jobs</div>
            <h1 className="browse-title">Running Jobs</h1>
            <p className="browse-subtitle">
              Manage your accepted jobs - submit for review or cancel when needed.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Active Jobs</div>
              <div className="browse-stat-value">{jobs.length}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="browse-alert" style={{ marginTop: "16px" }}>
            {error}
          </div>
        )}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>No Running Jobs</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "20px" }}>
                You don't have any accepted jobs running at the moment.
              </p>
              <Link to="/dashboard/student/browse" className="browse-btn browse-btn--primary">
                Browse Jobs →
              </Link>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Your Running Jobs</h2>
              <div className="browse-results-count">{jobs.length} found</div>
            </div>

            <div className="browse-cards">
              {jobs.map((job) => {
                const statusBadge = getSubmissionStatusBadge(job.submissionStatus);
                const timeTaken = job.submissionReport?.timeTaken;
                const daysSinceAccepted = job.acceptedAt
                  ? Math.floor((Date.now() - new Date(job.acceptedAt).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                return (
                  <article key={job._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main">
                        <div className="job-title">{job.title}</div>
                        <div className="job-sub">
                          {job.companyName} · {job.submissionStatus === "pending" ? "In Progress" : statusBadge.text}
                        </div>
                      </div>
                      <div className="job-badges">
                        <span className="badge badge--gold">{job.gold} Gold</span>
                        <span className="badge" style={statusBadge.style}>
                          {statusBadge.text}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {job.deadline && (
                        <span className="badge" style={{ fontSize: "11px" }}>
                          Deadline: {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {job.acceptedAt && (
                        <span className="badge" style={{ fontSize: "11px" }}>
                          Running for {daysSinceAccepted} day{daysSinceAccepted !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {job.submissionReport && (
                      <div style={{ marginTop: "12px", padding: "12px", background: "rgba(255,255,255,.05)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "8px" }}>Submission Report</div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {timeTaken && <div>Time Taken: {timeTaken} hours</div>}
                          {job.submissionReport.completionNotes && (
                            <div>Notes: {job.submissionReport.completionNotes}</div>
                          )}
                          {job.submissionReport.submittedAt && (
                            <div>Submitted: {new Date(job.submissionReport.submittedAt).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {job.submissionStatus === "rejected" && (
                      <div style={{ marginTop: "12px", padding: "12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: "12px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "8px", color: "#ef4444" }}>Rejection Reason</div>
                        <div style={{ fontSize: "12px", color: "#ef4444", marginBottom: "12px" }}>
                          {job.rejectionReason || "No reason provided"}
                        </div>
                        <button
                          onClick={() => handleReportRejection(job._id)}
                          className="browse-btn"
                          style={{
                            fontSize: "11px",
                            padding: "6px 12px",
                            background: "rgba(239,68,68,.8)",
                            border: "1px solid rgba(239,68,68,.5)",
                          }}
                        >
                          Report as Anomaly
                        </button>
                      </div>
                    )}

                    <div className="job-card-bottom">
                      <div className="job-meta">
                        <span className="meta-dot" />
                        {job.submissionStatus === "pending" ? "In Progress" : statusBadge.text}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {job.submissionStatus === "pending" && (
                          <>
                            <button
                              onClick={() => setShowSubmitModal(job._id)}
                              className="browse-btn browse-btn--primary"
                              style={{ fontSize: "12px", padding: "8px 14px" }}
                            >
                              Submit Job
                            </button>
                            <button
                              onClick={() => handleCancel(job._id)}
                              disabled={cancelling === job._id}
                              className="browse-btn browse-btn--ghost"
                              style={{ fontSize: "12px", padding: "8px 14px" }}
                            >
                              {cancelling === job._id ? "Cancelling..." : "Cancel"}
                            </button>
                          </>
                        )}
                        {job.submissionStatus === "submitted" && (
                          <span className="badge" style={{ borderColor: "rgba(59,130,246,.35)", background: "rgba(59,130,246,.16)", color: "#3b82f6", fontSize: "12px", padding: "8px 14px" }}>
                            Awaiting Review
                          </span>
                        )}
                        {job.submissionStatus === "confirmed" && (
                          <span className="badge" style={{ borderColor: "rgba(34,197,94,.35)", background: "rgba(34,197,94,.16)", color: "#22c55e", fontSize: "12px", padding: "8px 14px" }}>
                            Completed ✓
                          </span>
                        )}
                        {job.submissionStatus === "disputed" && (
                          <Link
                            to={`/dashboard/student/messages?taskId=${job._id}`}
                            className="browse-btn"
                            style={{
                              fontSize: "12px",
                              padding: "8px 14px",
                              background: "rgba(168,85,247,.8)",
                              border: "1px solid rgba(168,85,247,.5)",
                            }}
                          >
                            View Dispute
                          </Link>
                        )}
                        <Link
                          to={`/dashboard/student/messages?taskId=${job._id}`}
                          className="browse-btn browse-btn--ghost"
                          style={{ fontSize: "12px", padding: "8px 14px" }}
                        >
                          Messages
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Submit Modal */}
        {showSubmitModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
            onClick={() => {
              setShowSubmitModal(null);
              setSubmitForm({ proofUrl: "", timeTaken: "", completionNotes: "" });
            }}
          >
            <div
              className="browse-panel"
              style={{ maxWidth: "500px", width: "100%", position: "relative" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>Submit Job</h3>
              <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "20px" }}>
                Provide details about your job completion
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="browse-field">
                  <label className="browse-label">Proof URL (Optional)</label>
                  <input
                    type="url"
                    value={submitForm.proofUrl}
                    onChange={(e) => setSubmitForm({ ...submitForm, proofUrl: e.target.value })}
                    className="browse-input"
                    placeholder="https://..."
                  />
                </div>
                <div className="browse-field">
                  <label className="browse-label">Time Taken (hours, optional)</label>
                  <input
                    type="number"
                    value={submitForm.timeTaken}
                    onChange={(e) => setSubmitForm({ ...submitForm, timeTaken: e.target.value })}
                    className="browse-input"
                    placeholder="Auto-calculated if not provided"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="browse-field">
                  <label className="browse-label">Completion Notes (Optional)</label>
                  <textarea
                    value={submitForm.completionNotes}
                    onChange={(e) => setSubmitForm({ ...submitForm, completionNotes: e.target.value })}
                    className="browse-input"
                    rows={4}
                    style={{ resize: "vertical" }}
                    placeholder="Any additional notes about the completion..."
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  onClick={() => {
                    setShowSubmitModal(null);
                    setSubmitForm({ proofUrl: "", timeTaken: "", completionNotes: "" });
                  }}
                  className="browse-btn browse-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(showSubmitModal)}
                  disabled={submitting === showSubmitModal}
                  className="browse-btn browse-btn--primary"
                >
                  {submitting === showSubmitModal ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
