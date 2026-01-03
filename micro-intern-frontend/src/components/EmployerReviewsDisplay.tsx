import { useEffect, useState } from "react";
import { apiGet } from "../api/client";
import "../pages/dashboard/student/css/BrowsePage.css";

type EmployerReviewsDisplayProps = {
  employerId: string;
  compact?: boolean;
};

export default function EmployerReviewsDisplay({ employerId, compact = false }: EmployerReviewsDisplayProps) {
  const [rating, setRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviewStats();
  }, [employerId]);

  async function loadReviewStats() {
    try {
      setLoading(true);
      
      // Get profile which includes review stats
      const profileRes = await apiGet<{
        success: boolean;
        data: {
          averageRating?: number;
          totalReviews?: number;
          completedJobsCount?: number;
        };
      }>("/employer/me");

      if (profileRes.success && profileRes.data) {
        setRating(profileRes.data.averageRating || 0);
        setTotalReviews(profileRes.data.totalReviews || 0);
        setCompletedJobs(profileRes.data.completedJobsCount || 0);
      } else {
        // Fallback to reviews endpoint
        const res = await apiGet<{
          success: boolean;
          data: any[];
          averageRating: number;
          totalReviews: number;
        }>(`/reviews/employer/${employerId}`);

        if (res.success) {
          setRating(res.averageRating || 0);
          setTotalReviews(res.totalReviews || 0);
        }

        // Get completed jobs count
        const jobsRes = await apiGet<{ success: boolean; data: any[] }>("/employer/jobs");
        if (jobsRes.success) {
          const completed = jobsRes.data.filter((job: any) => job.status === "completed");
          setCompletedJobs(completed.length);
        }
      }
    } catch (err) {
      console.error("Failed to load review stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
        <span style={{ fontSize: "12px" }}>Loading...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill={star <= Math.round(rating) ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.2)"}
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          ))}
        </div>
        {rating > 0 && (
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>
            {rating.toFixed(1)}
          </span>
        )}
        {completedJobs > 0 && (
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            ({completedJobs} completed)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="browse-panel">
      <div className="browse-panel-head">
        <h2 className="browse-panel-title">Company Reviews</h2>
        <div className="browse-panel-subtitle">Your rating from student reviews</div>
      </div>
      <div style={{ marginTop: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="24"
                height="24"
                viewBox="0 0 20 20"
                fill={star <= Math.round(rating) ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.2)"}
                style={{
                  filter: star <= Math.round(rating) ? "drop-shadow(0 0 4px rgba(251,191,36,.4))" : "none",
                }}
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          {rating > 0 ? (
            <div>
              <span style={{ fontSize: "24px", fontWeight: "700", color: "var(--text)", marginRight: "8px" }}>
                {rating.toFixed(1)}
              </span>
              <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
          ) : (
            <span style={{ fontSize: "14px", color: "var(--muted)" }}>No reviews yet</span>
          )}
        </div>
        {completedJobs > 0 && (
          <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="meta-dot" />
            {completedJobs} {completedJobs === 1 ? "job completed" : "jobs completed"}
          </div>
        )}
      </div>
    </div>
  );
}

