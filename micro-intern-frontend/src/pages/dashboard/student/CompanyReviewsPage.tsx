import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/BrowsePage.css";

type CompletedJob = {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  employerId: {
    _id: string;
    name: string;
    companyName?: string;
  };
  updatedAt?: string;
  createdAt?: string;
  hasReview?: boolean;
};

type ApplicationsResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    status: string;
    internshipId: CompletedJob;
  }>;
};

export default function CompanyReviewsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<CompletedJob[]>([]);

  useEffect(() => {
    loadCompletedJobs();
  }, []);

  async function loadCompletedJobs() {
    try {
      setLoading(true);
      setError("");
      // Use the /jobs/completed endpoint which returns jobs with review status
      const res = await apiGet<{ success: boolean; data: CompletedJob[] }>("/jobs/completed");
      if (!res.success) {
        setError("Failed to load completed jobs");
        return;
      }

      // The API already includes reviewStatus, map it to hasReview
      const jobsWithReviewStatus = res.data.map((job: any) => ({
        ...job,
        hasReview: job.reviewStatus === "submitted",
      }));

      setJobs(jobsWithReviewStatus);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load completed jobs");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading completed jobs…</div>
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
            <div className="browse-eyebrow">Company Reviews</div>
            <h1 className="browse-title">Review Employers</h1>
            <p className="browse-subtitle">Share your experience working with employers</p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Completed</div>
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
              <div className="browse-empty-title">No Completed Jobs Yet</div>
              <div className="browse-empty-sub">
                You can review employers once you complete jobs that were accepted.
              </div>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Completed Jobs</h2>
              <div className="browse-results-count">{jobs.length} found</div>
            </div>
            <div className="browse-cards">
              {jobs.map((job) => {
                const badge = job.hasReview
                  ? { text: "Reviewed", color: "rgba(34,197,94,.9)", bg: "rgba(34,197,94,.16)", border: "rgba(34,197,94,.35)" }
                  : { text: "Pending Review", color: "rgba(251,191,36,.9)", bg: "rgba(251,191,36,.16)", border: "rgba(251,191,36,.35)" };

                return (
                  <article key={job._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main">
                        <div className="job-title">{job.title}</div>
                        <div className="job-sub">
                          {job.employerId.companyName || job.employerId.name} · <span className="job-loc">Completed</span>
                        </div>
                      </div>
                      <div className="job-badges">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: badge.bg,
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
                        Review status
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {!job.hasReview && (
                          <Link
                            to={`/dashboard/student/reviews/submit/${job._id}`}
                            className="browse-btn browse-btn--primary"
                          >
                            Submit Review
                          </Link>
                        )}
                        {job.hasReview && (
                          <span className="browse-btn browse-btn--ghost" style={{ opacity: 0.6 }}>
                            Already Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

