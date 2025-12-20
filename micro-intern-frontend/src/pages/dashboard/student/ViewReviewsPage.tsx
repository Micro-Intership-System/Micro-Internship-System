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
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="16"
            height="16"
            viewBox="0 0 20 20"
            style={{ color: star <= rating ? "#fbbf24" : "rgba(255,255,255,.3)", fill: "currentColor" }}
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
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
            <div className="browse-eyebrow">Reviews</div>
            <h1 className="browse-title">View all reviews for this student</h1>
            <p className="browse-subtitle">See what employers think about this student's work</p>
          </div>
        </header>

        {/* Summary */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
            <div>
              <div className="browse-stat-label" style={{ marginBottom: "4px" }}>Average Rating</div>
              <div className="browse-stat-value" style={{ fontSize: "36px" }}>{averageRating.toFixed(1)}</div>
            </div>
            <div>
              <div className="browse-stat-label" style={{ marginBottom: "4px" }}>Total Reviews</div>
              <div className="browse-stat-value" style={{ fontSize: "36px" }}>{totalReviews}</div>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              {renderStars(Math.round(averageRating))}
            </div>
          </div>
        </section>

        {/* Error */}
        {error && <div className="browse-alert" style={{ marginTop: "16px" }}>{error}</div>}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No Reviews Yet</div>
              <div className="browse-empty-sub">
                This student hasn't received any reviews yet.
              </div>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Reviews</h2>
              <div className="browse-results-count">{reviews.length} found</div>
            </div>
            <div className="browse-cards">
              {reviews.map((review) => (
                <article key={review._id} className="job-card">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(124,58,237,.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "18px",
                      fontWeight: "700",
                      flexShrink: 0,
                    }}>
                      {review.reviewerId.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <div className="job-title" style={{ marginBottom: "4px" }}>
                            {review.reviewerId.companyName || review.reviewerId.name}
                          </div>
                          <div className="job-sub" style={{ marginBottom: "8px" }}>
                            {review.taskId.title}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          {renderStars(review.starRating)}
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,.85)", lineHeight: "1.6", marginTop: "8px" }}>
                          {review.comment}
                        </p>
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
