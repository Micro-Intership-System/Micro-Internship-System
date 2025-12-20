import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/EmployerJobsPage.css";

type ApiResponse<T> = { success: boolean; data: T; message?: string };

type CompletedJob = {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  acceptedStudentId?: {
    _id: string;
    name: string;
    email: string;
  };
  updatedAt?: string;
  createdAt?: string;
  hasReview?: boolean;
};

export default function EmployerReviewsPage() {
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
      const res = await apiGet<ApiResponse<CompletedJob[]>>("/employer/jobs");
      if (!res.success) {
        setError("Failed to load completed jobs");
        return;
      }

      // Filter only completed jobs with accepted students
      const completed = (res.data || []).filter(
        (j) => j.status === "completed" && j.acceptedStudentId
      );

      // Check which jobs already have reviews from this employer
      const jobsWithReviewStatus = await Promise.all(
        completed.map(async (job) => {
          try {
            const reviewRes = await apiGet<{ success: boolean; data: any[] }>(
              `/reviews/task/${job._id}`
            );
            if (reviewRes.success && reviewRes.data) {
              // Check if current employer has already reviewed this task
              const hasReview = reviewRes.data.some(
                (r: any) => {
                  const reviewerId = typeof r.reviewerId === 'object' ? r.reviewerId?._id : r.reviewerId;
                  return r.reviewType === "employer_to_student" && reviewerId === user?.id;
                }
              );
              return { ...job, hasReview };
            }
            return { ...job, hasReview: false };
          } catch {
            return { ...job, hasReview: false };
          }
        })
      );

      setJobs(jobsWithReviewStatus);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load completed jobs");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="empJobs__loadingWrap">
        <div className="empJobs__loadingText">Loading completed jobs…</div>
      </div>
    );
  }

  return (
    <div className="empJobs">
      {/* Page Header */}
      <div className="empJobs__header">
        <div className="empJobs__headerLeft">
          <h1 className="empJobs__title">Reviews</h1>
          <p className="empJobs__subtitle">Review students who completed your jobs</p>
        </div>
      </div>

      {/* Error */}
      {error && <div className="empJobs__error">{error}</div>}

      {/* Jobs List */}
      <div className="empJobs__card">
        <div className="empJobs__cardHeader">
          <div className="empJobs__total">
            Completed Jobs: <strong>{jobs.length}</strong>
          </div>
        </div>

        <div className="empJobs__list">
          {jobs.length === 0 ? (
            <div className="empJobs__empty">
              <p className="empJobs__emptyText">
                No completed jobs yet. Reviews can be submitted once a job is completed.
              </p>
            </div>
          ) : (
            jobs.map((j) => (
              <div key={j._id} className="empJobs__row">
                {/* Job info */}
                <div className="empJobs__info">
                  <div className="empJobs__jobTitle">{j.title}</div>

                  <div className="empJobs__meta">
                    {j.companyName} • Completed • Student:{" "}
                    {j.acceptedStudentId?.name || "Unknown"}
                  </div>

                  <div className="empJobs__tags">
                    {j.hasReview && (
                      <span className="empJobs__pill" style={{ background: "rgba(34,197,94,.16)", color: "rgba(34,197,94,.9)", borderColor: "rgba(34,197,94,.35)" }}>
                        Review Submitted
                      </span>
                    )}
                    {!j.hasReview && (
                      <span className="empJobs__pill" style={{ background: "rgba(251,191,36,.16)", color: "rgba(251,191,36,.9)", borderColor: "rgba(251,191,36,.35)" }}>
                        Pending Review
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="empJobs__actions">
                  {!j.hasReview && (
                    <Link
                      to={`/dashboard/employer/reviews/submit/${j._id}`}
                      className="empJobs__btnPrimary"
                    >
                      Submit Review
                    </Link>
                  )}
                  {j.hasReview && (
                    <span className="empJobs__btnOutline" style={{ opacity: 0.6, cursor: "default" }}>
                      Already Reviewed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

