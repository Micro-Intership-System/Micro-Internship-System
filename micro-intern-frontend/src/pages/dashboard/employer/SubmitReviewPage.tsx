import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";
import "../student/css/BrowsePage.css";

type Task = {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  acceptedStudentId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
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
      navigate("/dashboard/employer/reviews");
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
            <h1 className="browse-title">Review Student Performance</h1>
            <p className="browse-subtitle">Share your feedback about the student's work</p>
          </div>
        </header>

        {/* Task Info */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Task Information</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
            <div>
              <span style={{ color: "var(--muted)", fontSize: "13px" }}>Task:</span>
              <span style={{ marginLeft: "8px", fontWeight: "600", color: "var(--text)" }}>
                {task.title}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--muted)", fontSize: "13px" }}>Student:</span>
              <span style={{ marginLeft: "8px", fontWeight: "600", color: "var(--text)" }}>
                {task.acceptedStudentId?.name || "Unknown"}
              </span>
              {task.acceptedStudentId?.email && (
                <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--muted)" }}>
                  ({task.acceptedStudentId.email})
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Review Form */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Your Review</h2>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.3)",
                borderRadius: "var(--r-md)",
                color: "rgba(239,68,68,.9)",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

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
          <div style={{ marginTop: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--text)",
                marginBottom: "12px",
              }}
            >
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your feedback about the student's work..."
              rows={6}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255,255,255,.05)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                color: "var(--text)",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.background = "rgba(255,255,255,.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "rgba(255,255,255,.05)";
              }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button
              onClick={submitReview}
              disabled={starRating === 0 || submitting}
              className="browse-btn browse-btn--primary"
              style={{
                opacity: starRating === 0 || submitting ? 0.5 : 1,
                cursor: starRating === 0 || submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              onClick={() => navigate("/dashboard/employer/reviews")}
              className="browse-btn browse-btn--ghost"
            >
              Cancel
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

