import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/EmployerJobsPage.css";

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
  status?: "completed" | "in_progress" | "open" | string;
  submissionStatus?: "submitted" | "pending" | "none" | string; // ✅ add this (you use it below)
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

function statusClass(status?: string) {
  if (status === "completed") return "empJobs__status empJobs__status--completed";
  if (status === "in_progress") return "empJobs__status empJobs__status--inprogress";
  return "empJobs__status empJobs__status--default";
}

export default function EmployerJobsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<InternshipJob[]>([]);

  const count = jobs.length;

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
      <div className="empJobs__loadingWrap">
        <div className="empJobs__loadingText">Loading your jobs…</div>
      </div>
    );
  }

  return (
    <div className="empJobs">
      {/* Page Header */}
      <div className="empJobs__header">
        <div className="empJobs__headerLeft">
          <h1 className="empJobs__title">Your Posted Jobs</h1>
          <p className="empJobs__subtitle">Manage listings and edit details anytime</p>
        </div>

        <Link to="/dashboard/employer/post" className="empJobs__btnPrimary">
          Post Internship
        </Link>
      </div>

      {/* Error */}
      {error && <div className="empJobs__error">{error}</div>}

      {/* Jobs List */}
      <div className="empJobs__card">
        <div className="empJobs__cardHeader">
          <div className="empJobs__total">
            Total: <strong>{count}</strong>
          </div>
        </div>

        <div className="empJobs__list">
          {jobs.length === 0 ? (
            <div className="empJobs__empty">
              <p className="empJobs__emptyText">
                You haven't posted anything yet. Click "Post Internship" to get started.
              </p>
              <Link to="/dashboard/employer/post" className="empJobs__btnPrimary">
                Post Internship
              </Link>
            </div>
          ) : (
            jobs.map((j) => (
              <div key={j._id} className="empJobs__row">
                {/* Job info */}
                <div className="empJobs__info">
                  <div className="empJobs__jobTitle">{j.title}</div>

                  <div className="empJobs__meta">
                    {j.companyName} • Posted by {user?.name || "Employer"} • {j.location} •{" "}
                    {j.duration}
                  </div>

                  <div className="empJobs__tags">
                    <span className="empJobs__pill">Gold: {j.gold.toLocaleString()}</span>
                    <span className="empJobs__pill">
                      Priority: {j.priorityLevel ?? "medium"}
                    </span>

                    {j.status && <span className={statusClass(j.status)}>{j.status}</span>}

                    <span className="empJobs__mutedInline">
                      Last updated: {timeAgo(j.updatedAt)}
                    </span>

                    <span className="empJobs__mutedInline">
                      Applicants: {j.applicantsCount ?? 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="empJobs__actions">
                  <Link
                    to={`/dashboard/employer/jobs/${j._id}/applications`}
                    className="empJobs__btnOutline"
                  >
                    Applications
                  </Link>

                  {j.submissionStatus === "submitted" && (
                    <Link
                      to="/dashboard/employer/submissions"
                      className="empJobs__btnSuccess"
                    >
                      Review Submission
                    </Link>
                  )}

                  {j.status === "completed" && (
                    <Link
                      to={`/dashboard/employer/reviews/submit/${j._id}`}
                      className="empJobs__btnOutline"
                    >
                      Review
                    </Link>
                  )}

                  <Link
                    to={`/dashboard/employer/jobs/${j._id}/edit`}
                    className="empJobs__btnPrimary"
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
