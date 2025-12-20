import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";
import "./css/BrowsePage.css";

type Task = {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  employerId: {
    _id: string;
    name: string;
    companyName?: string;
  };
};

export default function SubmitReviewPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (taskId) loadTask();
  }, [taskId]);

  async function loadTask() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: Task }>(`/internships/${taskId}`);
      if (res.success) {
        setTask(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    if (!taskId || starRating === 0) {
      setError("Please select a star rating");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await apiPost("/reviews", {
        taskId,
        starRating,
        comment: comment.trim() || undefined,
      });
      navigate("/dashboard/student/applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading task information…</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Task not found</div>
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
            <div className="browse-eyebrow">Submit Review</div>
            <h1 className="browse-title">Share your experience with this employer</h1>
            <p className="browse-subtitle">Help others by leaving an honest review</p>
          </div>
        </header>

        {/* Task Info */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Task Information</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <div>
              <span style={{ color: "var(--muted)" }}>Task:</span>
              <span style={{ marginLeft: "8px", fontWeight: "600", color: "var(--text)" }}>{task.title}</span>
            </div>
            <div>
              <span style={{ color: "var(--muted)" }}>Employer:</span>
              <span style={{ marginLeft: "8px", fontWeight: "600", color: "var(--text)" }}>
                {task.employerId.companyName || task.employerId.name}
              </span>
            </div>
          </div>
        </section>

        {/* Review Form */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Your Review</h2>
          </div>

          {/* Error */}
          {error && <div className="browse-alert" style={{ marginTop: "12px" }}>{error}</div>}

          {/* Star Rating */}
          <div style={{ marginTop: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--text)",
                marginBottom: "16px",
              }}
            >
              Rating <span style={{ color: "rgba(239,68,68,.9)" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarRating(star)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 20 20"
                    style={{
                      fill: star <= starRating ? "rgba(251,191,36,.95)" : "rgba(255,255,255,.2)",
                      color: star <= starRating ? "rgba(251,191,36,.95)" : "rgba(255,255,255,.2)",
                      filter: star <= starRating ? "drop-shadow(0 0 8px rgba(251,191,36,.5))" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                </button>
              ))}
            </div>
            {starRating > 0 && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--muted)",
                  marginTop: "12px",
                  fontWeight: "500",
                }}
              >
                {starRating === 5
                  ? "⭐ Excellent"
                  : starRating === 4
                  ? "⭐ Very Good"
                  : starRating === 3
                  ? "⭐ Good"
                  : starRating === 2
                  ? "⭐ Fair"
                  : "⭐ Poor"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div style={{ marginTop: "20px" }}>
            <label className="browse-label" style={{ marginBottom: "8px" }}>
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience working with this employer..."
              rows={6}
              className="browse-input"
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button
              onClick={submitReview}
              disabled={starRating === 0 || submitting}
              className="browse-btn browse-btn--primary"
              style={{ flex: 1, opacity: (starRating === 0 || submitting) ? 0.5 : 1 }}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              onClick={() => navigate("/dashboard/student/applications")}
              className="browse-btn browse-btn--ghost"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
