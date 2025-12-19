import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/JobSubmissionsPage.css";

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

  if (loading) {
    return (
      <div className="empSub__loadingWrap">
        <div className="empSub__loadingText">Loading submissions…</div>
      </div>
    );
  }

  return (
    <div className="empSub">
      {/* Page Header */}
      <div className="empSub__header">
        <h1 className="empSub__title">Job Submissions</h1>
        <p className="empSub__subtitle">Review and confirm or reject student submissions</p>
      </div>

      {/* Error */}
      {error && <div className="empSub__error">{error}</div>}

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="empSub__empty">
          <h3 className="empSub__emptyTitle">No Submissions</h3>
          <p className="empSub__emptyText">No jobs have been submitted for review yet.</p>
        </div>
      ) : (
        <div className="empSub__list">
          {submissions.map((sub) => (
            <div key={sub._id} className="empSub__card">
              <div className="empSub__cardTop">
                <div className="empSub__left">
                  <div className="empSub__titleRow">
                    <div className="empSub__icon">{sub.title.charAt(0)}</div>

                    <div className="empSub__jobTitleWrap">
                      <h3 className="empSub__jobTitle">{sub.title}</h3>

                      {sub.acceptedStudentId && (
                        <p className="empSub__submitter">
                          Submitted by: {sub.acceptedStudentId.name} ({sub.acceptedStudentId.email})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="empSub__badges">
                    <span className="empSub__badge">{sub.gold} Gold</span>

                    <span className="empSub__badge empSub__badge--info">
                      {sub.submissionStatus === "submitted"
                        ? "Submitted"
                        : sub.submissionStatus === "confirmed"
                        ? "Confirmed"
                        : sub.submissionStatus === "rejected"
                        ? "Rejected"
                        : "Disputed"}
                    </span>

                    {sub.submissionReport?.submittedAt && (
                      <span className="empSub__badge empSub__badge--muted">
                        Submitted: {new Date(sub.submissionReport.submittedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Submission Report */}
                  {sub.submissionReport && (
                    <div className="empSub__report">
                      <div className="empSub__reportTitle">Completion Report</div>
                      <div className="empSub__reportBody">
                        {sub.submissionReport.timeTaken && (
                          <div>Time Taken: {sub.submissionReport.timeTaken} hours</div>
                        )}
                        {sub.submissionReport.completionNotes && (
                          <div>Notes: {sub.submissionReport.completionNotes}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Proof URL */}
                  {sub.submissionProofUrl && (
                    <div className="empSub__proof">
                      <a
                        href={sub.submissionProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="empSub__proofLink"
                      >
                        View Proof Document →
                      </a>
                    </div>
                  )}
                </div>

                <div className="empSub__actions">
                  {sub.submissionStatus === "submitted" && (
                    <>
                      <button
                        onClick={() => handleConfirm(sub._id)}
                        disabled={confirming === sub._id}
                        className="empSub__btnSuccess"
                      >
                        {confirming === sub._id ? "Confirming..." : "Confirm & Pay"}
                      </button>

                      <button
                        onClick={() => setShowRejectModal(sub._id)}
                        disabled={rejecting === sub._id}
                        className="empSub__btnOutline"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {sub.submissionStatus === "confirmed" && (
                    <span className="empSub__statusPill empSub__statusPill--confirmed">
                      Confirmed ✓
                    </span>
                  )}

                  {sub.submissionStatus === "rejected" && (
                    <div>
                      <span className="empSub__statusPill empSub__statusPill--rejected">
                        Rejected
                      </span>

                      {sub.rejectionReason && (
                        <div className="empSub__rejectReason">Reason: {sub.rejectionReason}</div>
                      )}
                    </div>
                  )}

                  {sub.submissionStatus === "disputed" && (
                    <Link
                      to={`/dashboard/employer/messages?taskId=${sub._id}`}
                      className="empSub__btnDispute"
                    >
                      View Dispute
                    </Link>
                  )}

                  <Link
                    to={`/dashboard/employer/messages?taskId=${sub._id}`}
                    className="empSub__btnOutline"
                  >
                    Messages
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="empSub__modalOverlay">
          <div className="empSub__modal">
            <h2 className="empSub__modalTitle">Reject Submission</h2>

            <p className="empSub__modalText">
              Please provide a detailed reason for rejection (minimum 10 characters). This reason
              will be sent to the student.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="empSub__textarea"
              rows={4}
              placeholder="Enter rejection reason..."
            />

            <div className="empSub__modalActions">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="empSub__btnOutline empSub__modalBtn"
              >
                Cancel
              </button>

              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={
                  rejecting === showRejectModal || !rejectReason.trim() || rejectReason.trim().length < 10
                }
                className="empSub__btnDanger empSub__modalBtn"
              >
                {rejecting === showRejectModal ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
