import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiDelete } from "../../../api/client";
import "../student/css/BrowsePage.css";

type Employer = {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  companyName?: string;
  companyDescription?: string;
  verificationStatus?: string;
  totalTasksPosted?: number;
  totalPaymentsMade?: number;
  averageRating?: number;
  totalReviews?: number;
};

export default function EmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadEmployers();
  }, []);

  async function loadEmployers() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: Employer[] }>("/employer/all");
      if (res.success) {
        setEmployers(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load employers:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployers = employers.filter((employer) =>
    employer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employer.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleDeleteEmployer(employerId: string) {
    if (!confirm("Are you sure you want to delete this employer? This will permanently delete the employer, all their jobs, and all related data.")) {
      return;
    }

    try {
      await apiDelete(`/admin/users/${employerId}`);
      alert("Employer deleted successfully");
      await loadEmployers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete employer");
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading employers…</div>
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
            <h1 className="browse-title">Employer Management</h1>
            <p className="browse-subtitle">Search and manage all employers on the platform</p>
          </div>
        </header>

        {/* Search */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or company..."
            className="browse-input"
            style={{ width: "100%", maxWidth: "500px" }}
          />
        </section>

        {/* Employers List */}
        {filteredEmployers.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">
                {searchQuery ? "No employers found matching your search" : "No employers found"}
              </div>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Employers</h2>
              <div className="browse-results-count">{filteredEmployers.length} found</div>
            </div>
            <div className="browse-cards">
              {filteredEmployers.map((employer) => (
                <article key={employer._id} className="job-card">
                  <div className="job-card-top">
                    <div className="job-card-main">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        {employer.profilePicture ? (
                          <img
                            src={employer.profilePicture}
                            alt={employer.name}
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, rgba(124,58,237,.5), rgba(59,130,246,.4))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "18px",
                              fontWeight: "bold",
                              flexShrink: 0,
                            }}
                          >
                            {employer.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="job-title" style={{ marginBottom: "4px" }}>
                            {employer.name}
                          </div>
                          <div className="job-sub">{employer.email}</div>
                          {employer.companyName && (
                            <div className="job-sub" style={{ fontSize: "13px", fontWeight: "600", marginTop: "4px" }}>
                              {employer.companyName}
                            </div>
                          )}
                        </div>
                      </div>

                      {employer.companyDescription && (
                        <p className="job-sub" style={{ marginBottom: "12px", lineClamp: 2, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {employer.companyDescription}
                        </p>
                      )}

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
                        <span className="badge" style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}>
                          {employer.totalTasksPosted || 0} tasks posted
                        </span>
                        <span className="badge" style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}>
                          {employer.totalPaymentsMade || 0} payments
                        </span>
                        {employer.averageRating !== undefined && employer.averageRating > 0 && (
                          <Link
                            to={`/dashboard/admin/employers/${employer._id}/reviews`}
                            className="badge"
                            style={{
                              background: "rgba(251,191,36,.16)",
                              borderColor: "rgba(251,191,36,.35)",
                              color: "rgba(251,191,36,.9)",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  width="12"
                                  height="12"
                                  viewBox="0 0 20 20"
                                  fill={star <= Math.round(employer.averageRating || 0) ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.2)"}
                                >
                                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                              ))}
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "600" }}>
                              {employer.averageRating.toFixed(1)} ({employer.totalReviews || 0})
                            </span>
                          </Link>
                        )}
                        {(!employer.averageRating || employer.averageRating === 0) && (
                          <span className="badge" style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--muted)" }}>
                            No reviews yet
                          </span>
                        )}
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              employer.verificationStatus === "verified"
                                ? "rgba(34,197,94,.16)"
                                : "rgba(251,191,36,.16)",
                            borderColor:
                              employer.verificationStatus === "verified"
                                ? "rgba(34,197,94,.35)"
                                : "rgba(251,191,36,.35)",
                            color:
                              employer.verificationStatus === "verified"
                                ? "rgba(34,197,94,.9)"
                                : "rgba(251,191,36,.9)",
                          }}
                        >
                          {employer.verificationStatus || "Pending"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
                      <button
                        onClick={() => handleDeleteEmployer(employer._id)}
                        className="browse-btn browse-btn--danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--muted)" }}>
          Showing {filteredEmployers.length} of {employers.length} employers
        </div>
      </div>
    </div>
  );
}
