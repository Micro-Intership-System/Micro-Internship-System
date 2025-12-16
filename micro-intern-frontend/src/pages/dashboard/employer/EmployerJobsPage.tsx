import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";

type ApiResponse<T> = { success: boolean; data: T; message?: string };

type InternshipJob = {
  _id: string;
  title: string;
  location: string;
  duration: string;
  budget: number;
  priorityLevel?: "high" | "medium" | "low";
  skills?: string[];
  tags?: string[];
  companyName: string;
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
        setJobs(res.data);
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
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-600">Loading your jobs…</div>
      </div>
    );
  }

  return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Your posted jobs
        </h1>
        <p className="text-sm text-slate-600">
          Manage listings and edit details anytime.
        </p>
      </div>

      <Link
        to="/dashboard/employer/post"
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
      >
        Post internship
      </Link>
    </div>

    {/* Error */}
    {error && (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    )}

    {/* Jobs list */}
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Total:{" "}
          <span className="font-semibold text-slate-900">{count}</span>
        </div>
      </div>

      <div className="border-t border-slate-200">
        {jobs.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">
            You haven’t posted anything yet. Click “Post internship”.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {jobs.map((j) => (
              <div
                key={j._id}
                className="p-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
              >
                {/* Job info */}
                <div className="min-w-0 space-y-2">
                  <div className="text-lg font-semibold text-slate-900 truncate">
                    {j.title}
                  </div>

                  <div className="text-sm text-slate-600">
                    {j.companyName} • {j.location} • {j.duration}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                      Budget: {j.budget}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                      Priority: {j.priorityLevel ?? "medium"}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                      Updated {timeAgo(j.updatedAt)}
                    </span>

                    <span className="text-slate-600">
                      Applicants: {j.applicantsCount ?? 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/dashboard/employer/jobs/${j._id}/applications`}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    View applications
                  </Link>

                  <Link
                    to={`/dashboard/employer/jobs/${j._id}/edit`}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
}
