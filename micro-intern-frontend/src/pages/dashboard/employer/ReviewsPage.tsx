import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";
import "../student/css/BrowsePage.css";

type ReviewableTask = {
  _id: string;
  title: string;
  companyName: string;
  gold: number;
  completedAt: string;
  acceptedStudentId: {
    _id: string;
    name: string;
    email: string;
  };
  payment?: {
    status: string;
    releasedAt?: string;
  };
  hasReviewed?: boolean;
};

export default function ReviewsPage() {
  const [tasks, setTasks] = useState<ReviewableTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReviewableTasks();
  }, []);

  async function loadReviewableTasks() {
    try {
      setLoading(true);
      setError("");
      
      // Get all completed jobs (confirmed submissions)
      const completedJobsRes = await apiGet<{ success: boolean; data: any[] }>("/jobs/completed-employer");
      const completedJobs = completedJobsRes.success ? completedJobsRes.data : [];

      // Get existing reviews
      const reviewsRes = await apiGet<{ success: boolean; data: any[] }>("/reviews/me");
      const myReviews = reviewsRes.success ? reviewsRes.data : [];

      // Map completed jobs to reviewable tasks
      const reviewableTasks = completedJobs.map((job: any) => {
        // Check if we've already reviewed this student for this job
        const hasReviewed = myReviews.some((r: any) => {
          const rTaskId = r.taskId?._id || r.taskId;
          const rReviewedId = r.reviewedId?._id || r.reviewedId;
          const studentId = job.acceptedStudentId?._id || job.acceptedStudentId;
          return rTaskId === job._id && rReviewedId === studentId;
        });
        
        return {
          _id: job._id,
          title: job.title,
          companyName: job.companyName,
          gold: job.gold,
          completedAt: job.completedAt,
          acceptedStudentId: job.acceptedStudentId || { _id: "", name: "", email: "" },
          payment: job.payment ? {
            status: job.payment.status,
            releasedAt: job.payment.releasedAt,
          } : null,
          hasReviewed,
        };
      });

      setTasks(reviewableTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviewable tasks");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading reviews…</div>
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
            <div className="browse-eyebrow">Project Reviews</div>
            <h1 className="browse-title">Reviews</h1>
            <p className="browse-subtitle">
              Review students for completed projects. Reviews can only be submitted after payment is cleared.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Reviewable Projects</div>
              <div className="browse-stat-value">{tasks.length}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="browse-alert" style={{ marginTop: "16px" }}>
            {error}
          </div>
        )}

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>No Reviewable Projects</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                You don't have any completed projects with cleared payments yet.
              </p>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Reviewable Projects</h2>
              <div className="browse-results-count">{tasks.length} found</div>
            </div>

            <div className="browse-cards">
              {tasks.map((task) => (
                <article key={task._id} className="job-card">
                  <div className="job-card-top">
                    <div>
                      <h3 className="job-title">{task.title}</h3>
                      <div className="job-sub">
                        <span className="job-loc">Student: {task.acceptedStudentId.name}</span>
                      </div>
                    </div>
                    <div className="job-badges">
                      {task.hasReviewed ? (
                        <span className="badge" style={{ borderColor: "rgba(34,197,94,.35)", background: "rgba(34,197,94,.16)", color: "#22c55e" }}>
                          Reviewed
                        </span>
                      ) : (
                        <span className="badge" style={{ borderColor: "rgba(251,191,36,.35)", background: "rgba(251,191,36,.16)", color: "#fbbf24" }}>
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div><strong>Student:</strong> {task.acceptedStudentId?.name || "Unknown"} ({task.acceptedStudentId?.email || "N/A"})</div>
                    <div>Completed: {new Date(task.completedAt).toLocaleDateString()}</div>
                    {task.payment?.releasedAt && (
                      <div>Payment Cleared: {new Date(task.payment.releasedAt).toLocaleDateString()}</div>
                    )}
                    <div>Gold Paid: {task.gold.toLocaleString()}</div>
                  </div>

                  <div className="job-card-bottom" style={{ marginTop: "12px" }}>
                    <div />
                    <div>
                      {task.hasReviewed ? (
                        <span className="badge" style={{ borderColor: "rgba(34,197,94,.35)", background: "rgba(34,197,94,.16)", color: "#22c55e", fontSize: "12px", padding: "8px 14px" }}>
                          Already Reviewed
                        </span>
                      ) : (
                        <Link
                          to={`/dashboard/employer/reviews/submit/${task._id}`}
                          className="browse-btn browse-btn--primary"
                          style={{ fontSize: "12px", padding: "8px 14px" }}
                        >
                          Submit Review
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

