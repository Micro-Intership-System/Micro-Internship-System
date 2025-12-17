import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

type ApiResponse<T> = { success: boolean; data: T; message?: string };

type InternshipJob = {
  _id: string;
  title: string;
  location: string;
  duration: string;
  gold: number;
  priorityLevel?: "high" | "medium" | "low";
  skills?: string[];
  tags?: string[];
  companyName: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
  applicantsCount?: number;
};

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";

  const diffMs = Date.now() - t;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function EmployerJobsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<InternshipJob[]>([]);

  const count = useMemo(() => jobs.length, [jobs.length]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await apiGet<ApiResponse<InternshipJob[]>>("/employer/jobs");
        if (!mounted) return;
        setJobs(res.data || []);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load jobs");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading your jobs…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-2">Your Posted Jobs</h1>
          <p className="text-sm text-[#6b7280]">Manage listings and edit details anytime</p>
        </div>

        <Link
          to="/dashboard/employer/post"
          className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors whitespace-nowrap"
        >
          Post Internship
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Jobs List */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white overflow-hidden">
        <div className="p-6 border-b border-[#e5e7eb]">
          <div className="text-sm text-[#6b7280]">
            Total: <span className="font-semibold text-[#111827]">{count}</span>
          </div>
        </div>

        <div className="divide-y divide-[#e5e7eb]">
          {jobs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-[#6b7280] mb-6">
                You haven't posted anything yet. Click "Post Internship" to get started.
              </p>
              <Link
                to="/dashboard/employer/post"
                className="inline-block px-6 py-3 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors"
              >
                Post Internship
              </Link>
            </div>
          ) : (
            jobs.map((j) => (
              <div
                key={j._id}
                className="p-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between hover:bg-[#f9fafb] transition-colors"
              >
                {/* Job info */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="text-lg font-semibold text-[#111827] truncate">
                    {j.title}
                  </div>

                  <div className="text-sm text-[#6b7280]">
                    {j.companyName} • Posted by {user?.name || "Employer"} • {j.location} • {j.duration}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full bg-[#f9fafb] text-[#374151] border border-[#e5e7eb]">
                      Gold: {j.gold.toLocaleString()}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-[#f9fafb] text-[#374151] border border-[#e5e7eb]">
                      Priority: {j.priorityLevel ?? "medium"}
                    </span>

                    {j.status && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        j.status === "completed" ? "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]" :
                        j.status === "in_progress" ? "bg-[#fef3c7] text-[#92400e] border-[#fde68a]" :
                        "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]"
                      }`}>
                        {j.status}
                      </span>
                    )}

                    <span className="text-[#6b7280]">
                      Last updated: {j.updatedAt ? new Date(j.updatedAt).toLocaleString() : "Never"}
                    </span>

                    <span className="text-[#6b7280]">
                      Applicants: {j.applicantsCount ?? 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <Link
                    to={`/dashboard/employer/jobs/${j._id}/applications`}
                    className="px-4 py-2 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors whitespace-nowrap"
                  >
                    Applications
                  </Link>

                  {j.submissionStatus === "submitted" && (
                    <Link
                      to="/dashboard/employer/submissions"
                      className="px-4 py-2 rounded-lg bg-[#065f46] text-white text-sm font-semibold hover:bg-[#047857] transition-colors whitespace-nowrap"
                    >
                      Review Submission
                    </Link>
                  )}

                  {j.status === "completed" && (
                    <Link
                      to={`/dashboard/employer/reviews/submit/${j._id}`}
                      className="px-4 py-2 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors whitespace-nowrap"
                    >
                      Review
                    </Link>
                  )}

                  <Link
                    to={`/dashboard/employer/jobs/${j._id}/edit`}
                    className="px-4 py-2 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors whitespace-nowrap"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

