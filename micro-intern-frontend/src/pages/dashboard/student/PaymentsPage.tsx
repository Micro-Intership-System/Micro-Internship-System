import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/BrowsePage.css";

type Payment = {
  _id: string;
  amount: number;
  status: string;
  releasedAt?: string;
  createdAt: string;
  employerId: {
    _id: string;
    name: string;
    email: string;
    companyName?: string;
  };
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  taskId: {
    _id: string;
    title: string;
  };
};

export default function PaymentsPage() {
  const { user, refreshUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshUser();
    loadPayments();
    
    // Refresh payments when page becomes visible (e.g., after completing a job)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadPayments();
        refreshUser();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");
      
      // Load successful payments for this student
      const userId = (user as any)?._id || (user as any)?.id;
      if (!userId) {
        setError("User not found");
        return;
      }

      const paymentsRes = await apiGet<{ success: boolean; data: Payment[] }>(`/payments/student/${userId}`);
      if (paymentsRes.success) {
        setPayments(paymentsRes.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

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
            <div className="browse-eyebrow">My Payments</div>
            <h1 className="browse-title">Track payments for your completed tasks</h1>
            <p className="browse-subtitle">Monitor your earnings and payment status</p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Total Gold</div>
              <div className="browse-stat-value">{(user as any)?.gold || 0}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && <div className="browse-alert" style={{ marginTop: "16px" }}>{error}</div>}

        {/* Recent Payments Section */}
        <section className="browse-results" style={{ marginTop: "16px" }}>
          <div className="browse-results-head">
            <h2 className="browse-results-title">Recent Payments</h2>
            <div className="browse-results-count">{payments.length} payments</div>
          </div>
          {payments.length === 0 ? (
            <div className="browse-empty" style={{ marginTop: "16px" }}>
              <div className="browse-empty-title">No Payments Yet</div>
              <div className="browse-empty-sub">
                Successful payments from completed jobs will appear here.
              </div>
            </div>
          ) : (
            <div className="browse-cards" style={{ marginTop: "16px" }}>
              {payments.map((payment) => (
                <article key={payment._id} className="job-card">
                  <div className="job-card-top">
                    <div className="job-card-main">
                      <div className="job-title">{payment.taskId?.title || "Unknown Job"}</div>
                      <div className="job-sub" style={{ marginBottom: "8px" }}>
                        <span style={{ fontWeight: "600" }}>{payment.employerId?.companyName || payment.employerId?.name}</span>
                        {" paid "}
                        <span className="job-loc" style={{ fontWeight: "700", color: "rgba(251,191,36,.9)" }}>
                          {payment.amount.toLocaleString()} Gold
                        </span>
                        {" to "}
                        <span style={{ fontWeight: "600" }}>{payment.studentId?.name}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>
                        Payment released: {payment.releasedAt 
                          ? new Date(payment.releasedAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : new Date(payment.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </div>
                    </div>
                    <div className="job-badges">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "rgba(34,197,94,.16)",
                          borderColor: "rgba(34,197,94,.35)",
                          color: "rgba(34,197,94,.9)",
                        }}
                      >
                        Paid
                      </span>
                    </div>
                  </div>
                  <div className="job-card-bottom">
                    <div className="job-meta">
                      <span className="meta-dot" />
                      {payment.employerId?.email}
                    </div>
                    {payment.taskId?._id && (
                      <Link to={`/internships/${payment.taskId._id}`} className="browse-btn browse-btn--ghost">
                        View Job →
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
