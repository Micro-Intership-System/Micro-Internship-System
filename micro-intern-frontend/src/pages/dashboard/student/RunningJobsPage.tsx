import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

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
      await refreshUser(); // Refresh user data to get updated gold/xp
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
    const badges = {
      pending: { text: "In Progress", bg: "bg-[#fef3c7]", textColor: "text-[#92400e]", border: "border-[#fde68a]" },
      submitted: { text: "Submitted", bg: "bg-[#dbeafe]", textColor: "text-[#1e40af]", border: "border-[#bfdbfe]" },
      confirmed: { text: "Confirmed", bg: "bg-[#d1fae5]", textColor: "text-[#065f46]", border: "border-[#a7f3d0]" },
      rejected: { text: "Rejected", bg: "bg-[#fee2e2]", textColor: "text-[#991b1b]", border: "border-[#fecaca]" },
      disputed: { text: "Disputed", bg: "bg-[#f3e8ff]", textColor: "text-[#6b21a8]", border: "border-[#c4b5fd]" },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading running jobs…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Running Jobs</h1>
        <p className="text-sm text-[#6b7280]">Manage your accepted jobs - submit for review or cancel</p>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-16 text-center">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">No Running Jobs</h3>
          <p className="text-sm text-[#6b7280] mb-6">
            You don't have any accepted jobs running at the moment.
          </p>
          <Link
            to="/dashboard/student/browse"
            className="inline-block px-6 py-3 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map((job) => {
            const statusBadge = getSubmissionStatusBadge(job.submissionStatus);
            const timeTaken = job.submissionReport?.timeTaken;
            const daysSinceAccepted = job.acceptedAt
              ? Math.floor((Date.now() - new Date(job.acceptedAt).getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            return (
              <div key={job._id} className="border border-[#e5e7eb] rounded-lg bg-white p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-[#111827] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {job.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#111827] mb-1 truncate">
                          {job.title}
                        </h3>
                        <p className="text-sm text-[#6b7280]">{job.companyName}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="px-3 py-1.5 rounded-lg bg-[#f9fafb] text-[#374151] text-xs font-semibold border border-[#e5e7eb]">
                        {job.gold} Gold
                      </span>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusBadge.bg} ${statusBadge.textColor} ${statusBadge.border}`}>
                        {statusBadge.text}
                      </span>
                      {job.deadline && (
                        <span className="px-3 py-1.5 rounded-lg bg-[#f9fafb] text-[#374151] text-xs border border-[#e5e7eb]">
                          Deadline: {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                      {job.acceptedAt && (
                        <span className="px-3 py-1.5 rounded-lg bg-[#f9fafb] text-[#374151] text-xs border border-[#e5e7eb]">
                          Running for {daysSinceAccepted} day{daysSinceAccepted !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {job.submissionReport && (
                      <div className="mt-4 p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
                        <div className="text-sm font-semibold text-[#111827] mb-2">Submission Report</div>
                        <div className="text-xs text-[#6b7280] space-y-1">
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
                      <div className="mt-4 p-4 bg-[#fee2e2] border border-[#fecaca] rounded-lg">
                        <div className="text-sm font-semibold text-[#991b1b] mb-2">Rejection Reason</div>
                        <div className="text-xs text-[#991b1b] mb-3">
                          {job.rejectionReason || "No reason provided"}
                        </div>
                        <button
                          onClick={() => handleReportRejection(job._id)}
                          className="px-4 py-2 rounded-lg bg-[#991b1b] text-white text-xs font-semibold hover:bg-[#7f1d1d] transition-colors"
                        >
                          Report as Anomaly
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {job.submissionStatus === "pending" && (
                      <>
                        <button
                          onClick={() => setShowSubmitModal(job._id)}
                          className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors whitespace-nowrap"
                        >
                          Submit Job
                        </button>
                        <button
                          onClick={() => handleCancel(job._id)}
                          disabled={cancelling === job._id}
                          className="px-6 py-2.5 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          {cancelling === job._id ? "Cancelling..." : "Cancel Job"}
                        </button>
                      </>
                    )}
                    {job.submissionStatus === "submitted" && (
                      <span className="px-6 py-2.5 rounded-lg bg-[#dbeafe] text-[#1e40af] text-sm font-semibold border border-[#bfdbfe] whitespace-nowrap text-center">
                        Awaiting Review
                      </span>
                    )}
                    {job.submissionStatus === "confirmed" && (
                      <span className="px-6 py-2.5 rounded-lg bg-[#d1fae5] text-[#065f46] text-sm font-semibold border border-[#a7f3d0] whitespace-nowrap text-center">
                        Completed ✓
                      </span>
                    )}
                    {job.submissionStatus === "disputed" && (
                      <Link
                        to={`/dashboard/student/messages?taskId=${job._id}`}
                        className="px-6 py-2.5 rounded-lg bg-[#f3e8ff] text-[#6b21a8] text-sm font-semibold border border-[#c4b5fd] whitespace-nowrap text-center hover:bg-[#e9d5ff] transition-colors"
                      >
                        View Dispute Chat
                      </Link>
                    )}
                    <Link
                      to={`/dashboard/student/messages?taskId=${job._id}`}
                      className="px-6 py-2.5 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors whitespace-nowrap text-center"
                    >
                      Messages
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Submit Job</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-2">
                  Proof URL (Optional - Supabase PDF)
                </label>
                <input
                  type="url"
                  value={submitForm.proofUrl}
                  onChange={(e) => setSubmitForm({ ...submitForm, proofUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-[#d1d5db] rounded-lg text-sm"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-2">
                  Time Taken (hours, optional)
                </label>
                <input
                  type="number"
                  value={submitForm.timeTaken}
                  onChange={(e) => setSubmitForm({ ...submitForm, timeTaken: e.target.value })}
                  className="w-full px-4 py-2 border border-[#d1d5db] rounded-lg text-sm"
                  placeholder="Auto-calculated if not provided"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-2">
                  Completion Notes (Optional)
                </label>
                <textarea
                  value={submitForm.completionNotes}
                  onChange={(e) => setSubmitForm({ ...submitForm, completionNotes: e.target.value })}
                  className="w-full px-4 py-2 border border-[#d1d5db] rounded-lg text-sm"
                  rows={3}
                  placeholder="Any additional notes about the completion..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSubmitModal(null);
                  setSubmitForm({ proofUrl: "", timeTaken: "", completionNotes: "" });
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit(showSubmitModal)}
                disabled={submitting === showSubmitModal}
                className="flex-1 px-4 py-2 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors disabled:opacity-50"
              >
                {submitting === showSubmitModal ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

