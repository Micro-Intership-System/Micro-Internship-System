import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/BrowsePage.css";

type Payment = {
  _id: string;
  taskId: {
    _id: string;
    title: string;
    companyName: string;
    status: string;
    completedAt?: string;
  };
  employerId: {
    _id: string;
    name: string;
    companyName?: string;
  };
  amount: number;
  status: "pending" | "escrowed" | "released";
  escrowedAt?: string;
  releasedAt?: string;
};

type Review = {
  _id: string;
  taskId: string;
  starRating: number;
};

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  taskTitle: string;
  reviewedName: string;
  isReviewingEmployer: boolean;
};

function ReviewModal({ isOpen, onClose, onSubmit, taskTitle, reviewedName, isReviewingEmployer }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  function handleSubmit() {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    onSubmit(rating, comment);
    setRating(0);
    setComment("");
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="browse-panel"
        style={{ maxWidth: "500px", width: "100%", position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>
          Rate {isReviewingEmployer ? "Employer" : "Student"}
        </h3>
        <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "20px" }}>
          {taskTitle} - {reviewedName}
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", color: "var(--muted)" }}>
            Rating (1-5 stars)
          </label>
          <div style={{ display: "flex", gap: "8px", fontSize: "28px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: star <= (hoverRating || rating) ? "#fbbf24" : "rgba(255,255,255,0.3)",
                  transition: "color 0.2s",
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", marginBottom: "8px", color: "var(--muted)" }}>
            Comment (optional)
          </label>
          <textarea
            className="browse-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={4}
            style={{ resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button className="browse-btn browse-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="browse-btn browse-btn--primary" onClick={handleSubmit}>
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { user, refreshUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    taskId: string;
    employerId: string;
    taskTitle: string;
    employerName: string;
  } | null>(null);

  useEffect(() => {
    refreshUser();
    loadPayments();
    
    // Refresh periodically to keep totals updated
    const interval = setInterval(() => {
      refreshUser();
      loadPayments();
    }, 30000); // Every 30 seconds

    // Refresh when page gains focus
    const handleFocus = () => {
      refreshUser();
      loadPayments();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshUser]);

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<{ success: boolean; data: Payment[] }>("/payments/student/me");
      if (res.success) {
        setPayments(res.data || []);
        // Load existing reviews
        loadReviews(res.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews(payments: Payment[]) {
    try {
      const completedPayments = payments.filter((p) => p.status === "released" && p.taskId.status === "completed");
      const reviewPromises = completedPayments.map((p) =>
        apiGet<{ success: boolean; data: Review[] }>(`/reviews/task/${p.taskId._id}`).catch(() => null)
      );

      const reviewResults = await Promise.all(reviewPromises);
      const reviewsMap: Record<string, Review> = {};

      reviewResults.forEach((result, index) => {
        if (result && result.success && result.data) {
          const payment = completedPayments[index];
          if (payment) {
            // Find review from current user (student reviewing employer)
            const studentReview = result.data.find(
              (r: any) => r.reviewType === "student_to_employer" && (r.reviewerId?._id || r.reviewerId) === (user as any)?._id
            );
            if (studentReview) {
              reviewsMap[payment._id] = studentReview;
            }
          }
        }
      });

      setReviews(reviewsMap);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  }

  async function handleSubmitReview(rating: number, comment: string) {
    if (!reviewModal) return;

    try {
      await apiPost("/reviews", {
        taskId: reviewModal.taskId,
        starRating: rating,
        comment: comment || "",
      });
      await loadPayments();
      setReviewModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit review");
    }
  }

  function openReviewModal(payment: Payment) {
    setReviewModal({
      isOpen: true,
      taskId: payment.taskId._id,
      employerId: payment.employerId._id,
      taskTitle: payment.taskId.title,
      employerName: payment.employerId.companyName || payment.employerId.name,
    });
  }

  // Payment amount is already in gold units (not BDT)
  const completedPayments = payments.filter((p) => p.status === "released" && p.taskId.status === "completed");
  const totalGoldEarned = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Get gold from last completed job
  const lastCompletedPayment = completedPayments
    .sort((a, b) => {
      const dateA = a.releasedAt ? new Date(a.releasedAt).getTime() : 0;
      const dateB = b.releasedAt ? new Date(b.releasedAt).getTime() : 0;
      return dateB - dateA;
    })[0];
  const goldFromLastJob = lastCompletedPayment ? (lastCompletedPayment.amount || 0) : 0;

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading payments…</div>
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
            <div className="browse-eyebrow">Payment History</div>
            <h1 className="browse-title">Your Completed Jobs & Payments</h1>
            <p className="browse-subtitle">
              View payment history for completed tasks and leave reviews for employers.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Total Gold Earned</div>
              <div className="browse-stat-value">{totalGoldEarned}</div>
            </div>
            <div className="browse-stat">
              <div className="browse-stat-label">Completed</div>
              <div className="browse-stat-value">{completedPayments.length}</div>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <div className="browse-stat">
              <div className="browse-stat-label">Total Gold</div>
              <div className="browse-stat-value">{(user as any)?.gold || 0}</div>
            </div>
            <div className="browse-stat">
              <div className="browse-stat-label">Gold from Last Job</div>
              <div className="browse-stat-value">{goldFromLastJob}</div>
            </div>
            <div className="browse-stat">
              <div className="browse-stat-label">Total Gold Earned</div>
              <div className="browse-stat-value">{totalGoldEarned}</div>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="browse-alert" style={{ marginTop: "16px" }}>
            {error}
          </div>
        )}

        {/* Payments List */}
        {completedPayments.length === 0 ? (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>No Completed Payments Yet</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                Completed jobs with released payments will appear here.
              </p>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Completed Jobs</h2>
              <div className="browse-results-count">{completedPayments.length} found</div>
            </div>

            <div className="browse-cards">
              {completedPayments.map((payment) => {
                const hasReview = reviews[payment._id];
                const paymentDate = payment.releasedAt
                  ? new Date(payment.releasedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "";

                return (
                  <article key={payment._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main">
                        <div className="job-title">{payment.taskId.title}</div>
                        <div className="job-sub">
                          {payment.employerId.companyName || payment.employerId.name} · Payment Received
                        </div>
                      </div>
                      <div className="job-badges">
                        <span className="badge badge--gold">{bdtToGold(payment.amount)} Gold</span>
                        {hasReview && (
                          <span className="badge" style={{ borderColor: "rgba(251,191,36,.35)", background: "rgba(251,191,36,.16)" }}>
                            Reviewed
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", color: "var(--muted)", fontSize: "13px" }}>
                      <div>Payment received on: <strong>{paymentDate}</strong></div>
                    </div>

                    <div className="job-card-bottom">
                      <div className="job-meta">
                        <span className="meta-dot" />
                        Payment Released
                        <span className="meta-dot" />
                        {paymentDate}
                      </div>
                      {!hasReview ? (
                        <button
                          className="browse-btn browse-btn--primary"
                          onClick={() => openReviewModal(payment)}
                        >
                          Add Review →
                        </button>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "20px", color: "#fbbf24" }}>
                            {"★".repeat(hasReview.starRating)}
                          </span>
                          <span style={{ color: "var(--muted)", fontSize: "12px" }}>Reviewed</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Review Modal */}
        {reviewModal && (
          <ReviewModal
            isOpen={reviewModal.isOpen}
            onClose={() => setReviewModal(null)}
            onSubmit={handleSubmitReview}
            taskTitle={reviewModal.taskTitle}
            reviewedName={reviewModal.employerName}
            isReviewingEmployer={true}
          />
        )}
      </div>
    </div>
  );
}
