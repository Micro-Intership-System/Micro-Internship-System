import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../../../api/client";
import "../student/css/BrowsePage.css";

type Review = {
  _id: string;
  starRating: number;
  comment?: string;
  createdAt: string;
  reviewerId: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  taskId: {
    _id: string;
    title: string;
  };
};

type EmployerInfo = {
  _id: string;
  name: string;
  email: string;
  companyName?: string;
  profilePicture?: string;
};

export default function EmployerReviewsPage() {
  const { employerId } = useParams<{ employerId: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [employer, setEmployer] = useState<EmployerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (employerId) {
      loadData();
    }
  }, [employerId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      // Load employer info
      const employerRes = await apiGet<{ success: boolean; data: EmployerInfo }>(`/employer/${employerId}`);
      if (employerRes.success && employerRes.data) {
        setEmployer(employerRes.data);
      }

      // Load reviews
      const reviewsRes = await apiGet<{
        success: boolean;
        data: Review[];
        averageRating: number;
        totalReviews: number;
      }>(`/reviews/employer/${employerId}`);

      if (reviewsRes.success) {
        // Sort by date (oldest first - chronological order)
        const sortedReviews = (reviewsRes.data || []).sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        setReviews(sortedReviews);
        setAverageRating(reviewsRes.averageRating || 0);
        setTotalReviews(reviewsRes.totalReviews || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
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
            <div className="browse-eyebrow">Admin</div>
            <h1 className="browse-title">Employer Reviews</h1>
            {employer && (
              <p className="browse-subtitle">
                Reviews for {employer.companyName || employer.name}
              </p>
            )}
          </div>
          <div className="browse-actions">
            <Link to="/dashboard/admin/employers" className="browse-btn browse-btn--ghost">
              ← Back to Employers
            </Link>
          </div>
        </header>

        {/* Error */}
        {error && <div className="browse-alert" style={{ marginTop: "16px" }}>{error}</div>}

        {/* Employer Info */}
        {employer && (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {employer.profilePicture ? (
                <img
                  src={employer.profilePicture}
                  alt={employer.name}
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(124,58,237,.5), rgba(59,130,246,.4))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "24px",
                    fontWeight: "bold",
                  }}
                >
                  {employer.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>
                  {employer.companyName || employer.name}
                </div>
                <div style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "8px" }}>
                  {employer.email}
                </div>
                {averageRating > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill={star <= Math.round(averageRating) ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.2)"}
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <span style={{ fontSize: "16px", fontWeight: "600", color: "var(--text)" }}>
                      {averageRating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: "14px", color: "var(--muted)" }}>
                      ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No reviews yet</div>
              <div className="browse-empty-sub">This employer hasn't received any reviews from students.</div>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">All Reviews</h2>
              <div className="browse-results-count">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</div>
            </div>
            <div className="browse-cards">
              {reviews.map((review) => (
                <article key={review._id} className="job-card">
                  <div className="job-card-top">
                    <div className="job-card-main">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        {review.reviewerId.profilePicture ? (
                          <img
                            src={review.reviewerId.profilePicture}
                            alt={review.reviewerId.name}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, rgba(124,58,237,.5), rgba(59,130,246,.4))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "14px",
                              fontWeight: "bold",
                              flexShrink: 0,
                            }}
                          >
                            {review.reviewerId.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "4px" }}>
                            {review.reviewerId.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {review.reviewerId.email}
                          </div>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              width="16"
                              height="16"
                              viewBox="0 0 20 20"
                              fill={star <= review.starRating ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.2)"}
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>
                          {review.starRating} {review.starRating === 1 ? "star" : "stars"}
                        </span>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <div
                          style={{
                            padding: "12px",
                            background: "rgba(255,255,255,.05)",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            marginBottom: "12px",
                          }}
                        >
                          <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: "1.6", margin: 0 }}>
                            {review.comment}
                          </p>
                        </div>
                      )}

                      {/* Job Info */}
                      {review.taskId && (
                        <div style={{ marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Job: </span>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)" }}>
                            {review.taskId.title}
                          </span>
                        </div>
                      )}

                      {/* Date and Time */}
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {new Date(review.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
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

