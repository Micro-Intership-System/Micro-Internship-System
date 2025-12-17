import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

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
      if (res.success) {
        setSubmissions(res.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(jobId: string) {
    if (!confirm("Confirm this submission and release payment to the student?")) {
      return;
    }

    try {
      setConfirming(jobId);
      const res = await apiPost<{ success: boolean; data: any; goldAwarded?: number; studentNewBalance?: number }>(`/jobs/${jobId}/confirm`, {});
      if (res.success) {
        const message = res.goldAwarded 
          ? `Submission confirmed! ${res.goldAwarded} gold released to student.`
          : "Submission confirmed! Payment released to student.";
        alert(message);
        await loadSubmissions();
        // Refresh user data in case student is viewing their own dashboard
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
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading submissions…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Job Submissions</h1>
        <p className="text-sm text-[#6b7280]">Review and confirm or reject student submissions</p>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-16 text-center">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">No Submissions</h3>
          <p className="text-sm text-[#6b7280] mb-6">
            No jobs have been submitted for review yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((sub) => (
            <div key={sub._id} className="border border-[#e5e7eb] rounded-lg bg-white p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[#111827] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {sub.title.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[#111827] mb-1 truncate">
                        {sub.title}
                      </h3>
                      {sub.acceptedStudentId && (
                        <p className="text-sm text-[#6b7280]">
                          Submitted by: {sub.acceptedStudentId.name} ({sub.acceptedStudentId.email})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-3 py-1.5 rounded-lg bg-[#f9fafb] text-[#374151] text-xs font-semibold border border-[#e5e7eb]">
                      {sub.gold} Gold
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-[#dbeafe] text-[#1e40af] text-xs font-semibold border border-[#bfdbfe]">
                      Submitted
                    </span>
                    {sub.submissionReport?.submittedAt && (
                      <span className="px-3 py-1.5 rounded-lg bg-[#f9fafb] text-[#374151] text-xs border border-[#e5e7eb]">
                        Submitted: {new Date(sub.submissionReport.submittedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Submission Report */}
                  {sub.submissionReport && (
                    <div className="mt-4 p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
                      <div className="text-sm font-semibold text-[#111827] mb-2">Completion Report</div>
                      <div className="text-xs text-[#6b7280] space-y-1">
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
                    <div className="mt-4">
                      <a
                        href={sub.submissionProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#111827] hover:underline"
                      >
                        View Proof Document →
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {sub.submissionStatus === "submitted" && (
                    <>
                      <button
                        onClick={() => handleConfirm(sub._id)}
                        disabled={confirming === sub._id}
                        className="px-6 py-2.5 rounded-lg bg-[#065f46] text-white text-sm font-semibold hover:bg-[#047857] transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        {confirming === sub._id ? "Confirming..." : "Confirm & Pay"}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(sub._id)}
                        disabled={rejecting === sub._id}
                        className="px-6 py-2.5 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {sub.submissionStatus === "confirmed" && (
                    <span className="px-6 py-2.5 rounded-lg bg-[#d1fae5] text-[#065f46] text-sm font-semibold border border-[#a7f3d0] whitespace-nowrap text-center">
                      Confirmed ✓
                    </span>
                  )}
                  {sub.submissionStatus === "rejected" && (
                    <div className="space-y-2">
                      <span className="px-6 py-2.5 rounded-lg bg-[#fee2e2] text-[#991b1b] text-sm font-semibold border border-[#fecaca] whitespace-nowrap text-center block">
                        Rejected
                      </span>
                      {sub.rejectionReason && (
                        <div className="text-xs text-[#991b1b] max-w-xs">
                          Reason: {sub.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}
                  {sub.submissionStatus === "disputed" && (
                    <Link
                      to={`/dashboard/employer/messages?taskId=${sub._id}`}
                      className="px-6 py-2.5 rounded-lg bg-[#f3e8ff] text-[#6b21a8] text-sm font-semibold border border-[#c4b5fd] whitespace-nowrap text-center hover:bg-[#e9d5ff] transition-colors"
                    >
                      View Dispute
                    </Link>
                  )}
                  <Link
                    to={`/dashboard/employer/messages?taskId=${sub._id}`}
                    className="px-6 py-2.5 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors whitespace-nowrap text-center"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Reject Submission</h2>
            <p className="text-sm text-[#6b7280] mb-4">
              Please provide a detailed reason for rejection (minimum 10 characters). This reason will be sent to the student.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2 border border-[#d1d5db] rounded-lg text-sm mb-4"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={rejecting === showRejectModal || !rejectReason.trim() || rejectReason.trim().length < 10}
                className="flex-1 px-4 py-2 rounded-lg bg-[#991b1b] text-white text-sm font-semibold hover:bg-[#7f1d1d] transition-colors disabled:opacity-50"
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

