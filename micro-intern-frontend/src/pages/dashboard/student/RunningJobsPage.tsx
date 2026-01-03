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
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  const [reportingJob, setReportingJob] = useState<RunningJob | null>(null);
  const [submitForm, setSubmitForm] = useState({
    proofUrl: "",
    timeTaken: "",
    completionNotes: "",
  });

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

  function handleReportRejectionClick(job: RunningJob) {
    setReportingJob(job);
    setShowReportModal(job._id);
  }

  async function handleReportRejection(jobId: string) {
    if (!reportingJob) return;

    const escrowAmount = Math.ceil(reportingJob.gold * 0.5);
    const currentGold = (user as any)?.gold || 0;

    if (currentGold < escrowAmount) {
      alert(`Insufficient gold. You need ${escrowAmount} gold (50% of job payment) to report this rejection as an anomaly. Your current balance: ${currentGold} gold.`);
      setShowReportModal(null);
      setReportingJob(null);
      return;
    }

    try {
      await apiPost(`/jobs/${jobId}/report-rejection`, {});
      alert(`Rejection reported successfully. ${escrowAmount} gold has been placed in escrow. A dispute has been opened and admin will review.`);
      setShowReportModal(null);
      setReportingJob(null);
      await loadJobs();
      await refreshUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to report rejection";
      alert(errorMessage);
      setShowReportModal(null);
      setReportingJob(null);
    }
  }

  function getSubmissionStatusBadge(status: string) {
    const badges = {
      pending: { text: "In Progress", color: "rgba(251,191,36,.9)", bg: "rgba(251,191,36,.16)", border: "rgba(251,191,36,.35)" },
      submitted: { text: "Submitted", color: "rgba(59,130,246,.9)", bg: "rgba(59,130,246,.16)", border: "rgba(59,130,246,.35)" },
      confirmed: { text: "Confirmed", color: "rgba(34,197,94,.9)", bg: "rgba(34,197,94,.16)", border: "rgba(34,197,94,.35)" },
      rejected: { text: "Rejected", color: "rgba(239,68,68,.9)", bg: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.35)" },
      disputed: { text: "Disputed", color: "rgba(168,85,247,.9)", bg: "rgba(168,85,247,.16)", border: "rgba(168,85,247,.35)" },
    };
    return badges[status as keyof typeof badges] || badges.pending;
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
            <div className="browse-eyebrow">Running Jobs</div>
            <h1 className="browse-title">Manage your accepted jobs</h1>
            <p className="browse-subtitle">Submit for review or cancel your running jobs</p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Active</div>
              <div className="browse-stat-value">{jobs.length}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && <div className="browse-alert" style={{ marginTop: "16px" }}>{error}</div>}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No Running Jobs</div>
              <div className="browse-empty-sub">
                You don't have any accepted jobs running at the moment.
              </div>
              <Link
                to="/dashboard/student/browse"
                className="browse-btn browse-btn--primary"
                style={{ marginTop: "16px" }}
              >
                Browse Jobs →
              </Link>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Running Jobs</h2>
              <div className="browse-results-count">{jobs.length} active</div>
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
                          {job.companyName} · <span className="job-loc">{job.gold} Gold</span>
                        </div>
                      </div>
                      <div className="job-badges">
                        <span className="badge badge--gold">{job.gold} Gold</span>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: statusBadge.bg,
                            borderColor: statusBadge.border,
                            color: statusBadge.color,
                          }}
                        >
                          {statusBadge.text}
                        </span>
                      </div>
                    </div>

                    {job.deadline && (
                      <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--muted)" }}>
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                        {job.acceptedAt && ` · Running for ${daysSinceAccepted} day${daysSinceAccepted !== 1 ? "s" : ""}`}
                      </div>
                    )}

                    {job.submissionReport && (
                      <div style={{ marginTop: "12px", padding: "12px", background: "rgba(255,255,255,.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,.1)" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>Submission Report</div>
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
                      <div style={{ marginTop: "12px", padding: "12px", background: "rgba(239,68,68,.12)", borderRadius: "12px", border: "1px solid rgba(239,68,68,.35)" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "rgba(239,68,68,.9)", marginBottom: "6px" }}>Rejection Reason</div>
                        <div style={{ fontSize: "12px", color: "rgba(239,68,68,.9)", marginBottom: "8px" }}>
                          {job.rejectionReason || "No reason provided"}
                        </div>
                        <button
                          onClick={() => handleReportRejectionClick(job)}
                          className="browse-btn"
                          style={{ background: "rgba(239,68,68,.2)", borderColor: "rgba(239,68,68,.5)", color: "rgba(239,68,68,.9)", fontSize: "12px", padding: "6px 12px" }}
                        >
                          Report as Anomaly
                        </button>
                      </div>
                    )}

                    <div className="job-card-bottom">
                      <div className="job-meta">
                        <span className="meta-dot" />
                        {job.submissionStatus === "pending" ? "In progress" : job.submissionStatus}
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
                              style={{ fontSize: "12px", padding: "8px 14px", opacity: cancelling === job._id ? 0.5 : 1 }}
                            >
                              {cancelling === job._id ? "Cancelling..." : "Cancel"}
                            </button>
                          </>
                        )}
                        {job.submissionStatus === "disputed" && (
                          <Link
                            to={`/dashboard/student/messages?taskId=${job._id}`}
                            className="browse-btn browse-btn--ghost"
                            style={{ fontSize: "12px", padding: "8px 14px" }}
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
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
            <div className="browse-panel" style={{ maxWidth: "500px", width: "100%", margin: 0 }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>Submit Job</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="browse-field">
                  <label className="browse-label">Proof URL (Optional - Supabase PDF)</label>
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
                    rows={3}
                    placeholder="Any additional notes about the completion..."
                    style={{ resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button
                  onClick={() => {
                    setShowSubmitModal(null);
                    setSubmitForm({ proofUrl: "", timeTaken: "", completionNotes: "" });
                  }}
                  className="browse-btn browse-btn--ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(showSubmitModal)}
                  disabled={submitting === showSubmitModal}
                  className="browse-btn browse-btn--primary"
                  style={{ flex: 1, opacity: submitting === showSubmitModal ? 0.5 : 1 }}
                >
                  {submitting === showSubmitModal ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Rejection Modal */}
        {showReportModal && reportingJob && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
            <div className="browse-panel" style={{ maxWidth: "500px", width: "100%", margin: 0 }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>Report Rejection as Anomaly</h2>
              
              {/* Warning Section */}
              <div style={{ marginBottom: "20px", padding: "16px", background: "rgba(251,191,36,.12)", border: "1px solid rgba(251,191,36,.35)", borderRadius: "12px" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "rgba(251,191,36,.9)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Escrow Payment Required
                </div>
                <div style={{ fontSize: "13px", color: "rgba(251,191,36,.9)", lineHeight: "1.6" }}>
                  <p style={{ marginBottom: "8px" }}>
                    To report this rejection as an anomaly, <strong>50% of the job payment ({Math.ceil(reportingJob.gold * 0.5)} gold)</strong> will be placed in an escrow vault for safekeeping.
                  </p>
                  <p style={{ marginBottom: "8px" }}>
                    <strong>If you win the dispute:</strong> You will receive 150% of the original payment (original + escrow + 50% bonus).
                  </p>
                  <p>
                    <strong>If you lose the dispute:</strong> The escrow amount (50% of payment) will be forfeited.
                  </p>
                </div>
              </div>

              {/* Current Balance Info */}
              <div style={{ marginBottom: "20px", padding: "12px", background: "rgba(255,255,255,.05)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Job Payment</div>
                <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>{reportingJob.gold} Gold</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Escrow Amount (50%)</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "rgba(251,191,36,.9)", marginBottom: "8px" }}>
                  {Math.ceil(reportingJob.gold * 0.5)} Gold
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>Your Current Balance</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: ((user as any)?.gold || 0) >= Math.ceil(reportingJob.gold * 0.5) ? "rgba(34,197,94,.9)" : "rgba(239,68,68,.9)" }}>
                  {(user as any)?.gold || 0} Gold
                </div>
                {((user as any)?.gold || 0) < Math.ceil(reportingJob.gold * 0.5) && (
                  <div style={{ fontSize: "12px", color: "rgba(239,68,68,.9)", marginTop: "8px", padding: "8px", background: "rgba(239,68,68,.1)", borderRadius: "6px" }}>
                    ⚠️ Insufficient gold. You need {Math.ceil(reportingJob.gold * 0.5)} gold to report this rejection.
                  </div>
                )}
              </div>

              {/* Job Info */}
              <div style={{ marginBottom: "20px", fontSize: "13px", color: "var(--muted)" }}>
                <div style={{ marginBottom: "4px" }}><strong>Job:</strong> {reportingJob.title}</div>
                <div style={{ marginBottom: "4px" }}><strong>Company:</strong> {reportingJob.companyName}</div>
                {reportingJob.rejectionReason && (
                  <div style={{ marginTop: "8px", padding: "8px", background: "rgba(239,68,68,.1)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "rgba(239,68,68,.9)", marginBottom: "4px" }}>Rejection Reason:</div>
                    <div style={{ fontSize: "12px", color: "rgba(239,68,68,.9)" }}>{reportingJob.rejectionReason}</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowReportModal(null);
                    setReportingJob(null);
                  }}
                  className="browse-btn browse-btn--ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReportRejection(reportingJob._id)}
                  disabled={((user as any)?.gold || 0) < Math.ceil(reportingJob.gold * 0.5)}
                  className="browse-btn browse-btn--primary"
                  style={{ 
                    flex: 1, 
                    opacity: ((user as any)?.gold || 0) < Math.ceil(reportingJob.gold * 0.5) ? 0.5 : 1,
                    cursor: ((user as any)?.gold || 0) < Math.ceil(reportingJob.gold * 0.5) ? "not-allowed" : "pointer"
                  }}
                >
                  Confirm & Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
