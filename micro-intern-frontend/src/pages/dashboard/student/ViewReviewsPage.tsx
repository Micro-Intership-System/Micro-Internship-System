import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../../../api/client";
import "./css/BrowsePage.css";

type Review = {
  _id: string;
  reviewerId: {
    _id: string;
    name: string;
    companyName?: string;
  };
  reviewedId: {
    _id: string;
    name: string;
  };
  taskId: {
    _id: string;
    title: string;
  };
  starRating: number;
  comment?: string;
  reviewType: "employer_to_student" | "student_to_employer";
  createdAt: string;
};

export default function ViewReviewsPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (studentId) loadReviews();
  }, [studentId]);

  async function loadReviews() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<{
        success: boolean;
        data: Review[];
        averageRating: number;
        totalReviews: number;
      }>(`/reviews/student/${studentId}`);
      if (res.success) {
        setReviews(res.data || []);
        setAverageRating(res.averageRating || 0);
        setTotalReviews(res.totalReviews || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  function renderStars(rating: number) {
    return (
      <div style={{ display: "flex", gap: "2px", fontSize: "16px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              color: star <= rating ? "#fbbf24" : "rgba(255,255,255,0.3)",
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
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
            <div className="browse-eyebrow">Student Reviews</div>
            <h1 className="browse-title">Reviews</h1>
            <p className="browse-subtitle">
              View all reviews for this student
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Average Rating</div>
              <div className="browse-stat-value">{averageRating.toFixed(1)}</div>
            </div>
            <div className="browse-stat">
              <div className="browse-stat-label">Total Reviews</div>
              <div className="browse-stat-value">{totalReviews}</div>
            </div>
          </div>
        </header>

        {/* Summary */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div>
              <div className="browse-stat-label" style={{ marginBottom: "8px" }}>Overall Rating</div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)" }}>
                {averageRating.toFixed(1)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {renderStars(Math.round(averageRating))}
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="browse-alert" style={{ marginTop: "16px" }}>
            {error}
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>No Reviews Yet</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                This student hasn't received any reviews yet.
              </p>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">All Reviews</h2>
              <div className="browse-results-count">{reviews.length} found</div>
            </div>

            <div className="browse-cards">
              {reviews.map((review) => (
                <article key={review._id} className="job-card">
                  <div className="job-card-top">
                    <div className="job-card-main">
                      <div className="job-title">{review.taskId.title}</div>
                      <div className="job-sub">
                        {review.reviewerId.companyName || review.reviewerId.name} · {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="job-badges">
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {renderStars(review.starRating)}
                      </div>
                    </div>
                  </div>

                  {review.comment && (
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--text)", lineHeight: 1.6 }}>
                      {review.comment}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

