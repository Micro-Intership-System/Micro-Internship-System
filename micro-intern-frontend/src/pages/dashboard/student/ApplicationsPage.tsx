import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";
import "./css/BrowsePage.css";

type Application = {
  _id: string;
  status: "evaluating" | "accepted" | "rejected" | "applied";
  internshipId: {
    _id: string;
    title: string;
    companyName: string;
    status?: string;
  };
  createdAt: string;
};

type ApplicationsResponse = {
  success: boolean;
  data: Application[];
};

function getStatusBadge(status: string) {
  const badges = {
    accepted: { text: "Accepted", style: { borderColor: "rgba(34,197,94,.35)", background: "rgba(34,197,94,.16)", color: "#22c55e" } },
    rejected: { text: "Rejected", style: { borderColor: "rgba(239,68,68,.35)", background: "rgba(239,68,68,.16)", color: "#ef4444" } },
    evaluating: { text: "Under Review", style: { borderColor: "rgba(251,191,36,.35)", background: "rgba(251,191,36,.16)", color: "#fbbf24" } },
    applied: { text: "Applied", style: { borderColor: "rgba(59,130,246,.35)", background: "rgba(59,130,246,.16)", color: "#3b82f6" } },
  };
  return badges[status as keyof typeof badges] || badges.applied;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<ApplicationsResponse>("/applications/me");
      if (res.success) {
        // Filter to only show pending applications:
        // - Status must be "applied" or "evaluating" (not rejected or accepted)
        // - Job status must not be "completed"
        const pendingApps = (res.data || []).filter((app) => {
          const isPendingStatus = app.status === "applied" || app.status === "evaluating";
          const isJobNotCompleted = app.internshipId.status !== "completed";
          return isPendingStatus && isJobNotCompleted;
        });
        setApps(pendingApps);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading applications…</div>
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
            <div className="browse-eyebrow">Job Applications</div>
            <h1 className="browse-title">My Applications</h1>
            <p className="browse-subtitle">
              Track the status of your job applications and manage your opportunities.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Applications</div>
              <div className="browse-stat-value">{apps.length}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="browse-alert" style={{ marginTop: "16px" }}>
            {error}
          </div>
        )}

        {/* Applications List */}
        {apps.length === 0 ? (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>No Applications Yet</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "20px" }}>
                You haven't applied to any jobs yet. Start browsing opportunities!
              </p>
              <Link to="/dashboard/student/browse" className="browse-btn browse-btn--primary">
                Browse Jobs →
              </Link>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Your Applications</h2>
              <div className="browse-results-count">{apps.length} found</div>
            </div>

            <div className="browse-cards">
              {apps.map((app) => {
                const badge = getStatusBadge(app.status);
                return (
                  <article key={app._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main">
                        <div className="job-title">{app.internshipId.title}</div>
                        <div className="job-sub">
                          {app.internshipId.companyName} · Applied {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="job-badges">
                        <span className="badge" style={badge.style}>
                          {badge.text}
                        </span>
                      </div>
                    </div>

                    <div className="job-card-bottom">
                      <div className="job-meta">
                        <span className="meta-dot" />
                        {app.internshipId.status || "Active"}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Link
                          to={`/internships/${app.internshipId._id}`}
                          className="browse-btn browse-btn--ghost"
                        >
                          View Job
                        </Link>
                        {app.status === "accepted" && app.internshipId.status === "completed" && (
                          <Link
                            to={`/dashboard/student/reviews/submit/${app.internshipId._id}`}
                            className="browse-btn browse-btn--primary"
                          >
                            Review
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
