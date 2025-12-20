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
  rejectionReason?: string;
};

type ApplicationsResponse = {
  success: boolean;
  data: Application[];
};

function getStatusBadge(status: string) {
  const badges = {
    accepted: { text: "Accepted", color: "rgba(34,197,94,.9)", bg: "rgba(34,197,94,.16)", border: "rgba(34,197,94,.35)" },
    rejected: { text: "Rejected", color: "rgba(239,68,68,.9)", bg: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.35)" },
    evaluating: { text: "Under Review", color: "rgba(251,191,36,.9)", bg: "rgba(251,191,36,.16)", border: "rgba(251,191,36,.35)" },
    applied: { text: "Applied", color: "rgba(59,130,246,.9)", bg: "rgba(59,130,246,.16)", border: "rgba(59,130,246,.35)" },
  };
  return badges[status as keyof typeof badges] || badges.applied;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [rejectedApps, setRejectedApps] = useState<Application[]>([]);
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
        // Separate active and rejected applications
        const allApps = res.data || [];
        const active = allApps.filter(
          (app) => app.status !== "accepted" && app.status !== "rejected"
        );
        const rejected = allApps.filter((app) => app.status === "rejected");
        setApps(active);
        setRejectedApps(rejected);
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
            <div className="browse-eyebrow">My Applications</div>
            <h1 className="browse-title">Track the status of your job applications</h1>
            <p className="browse-subtitle">Monitor your application progress and manage your opportunities</p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Total</div>
              <div className="browse-stat-value">{apps.length}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && <div className="browse-alert" style={{ marginTop: "16px" }}>{error}</div>}

        {/* Applications List */}
        {apps.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No Applications Yet</div>
              <div className="browse-empty-sub">
                You haven't applied to any jobs yet. Start browsing opportunities!
              </div>
              <Link
                to="/dashboard/student/browse"
                className="browse-btn browse-btn--primary"
                style={{ marginTop: "16px" }}
              >
                Browse Jobs →
              </Link>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Applications</h2>
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
                          {app.internshipId.companyName} · <span className="job-loc">Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="job-badges">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: badge.bg,
                            borderColor: badge.border,
                            color: badge.color,
                          }}
                        >
                          {badge.text}
                        </span>
                      </div>
                    </div>
                    {app.status === "rejected" && app.rejectionReason && (
                      <div style={{ marginTop: "12px", padding: "12px", background: "rgba(239,68,68,.1)", borderRadius: "12px", border: "1px solid rgba(239,68,68,.35)" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "rgba(239,68,68,.9)", marginBottom: "6px" }}>Rejection Reason</div>
                        <div style={{ fontSize: "13px", color: "rgba(239,68,68,.8)", lineHeight: "1.5" }}>
                          {app.rejectionReason}
                        </div>
                      </div>
                    )}
                    <div className="job-card-bottom">
                      <div className="job-meta">
                        <span className="meta-dot" />
                        Application status
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Link
                          to={`/internships/${app.internshipId._id}`}
                          className="browse-btn browse-btn--ghost"
                        >
                          View Job
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Rejected Applications Section */}
        {rejectedApps.length > 0 && (
          <section className="browse-results" style={{ marginTop: "24px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Rejected Applications</h2>
              <div className="browse-results-count">{rejectedApps.length} found</div>
            </div>
            <div className="browse-cards">
              {rejectedApps.map((app) => {
                const badge = getStatusBadge(app.status);
                return (
                  <article key={app._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main">
                        <div className="job-title">{app.internshipId.title}</div>
                        <div className="job-sub">
                          {app.internshipId.companyName} · <span className="job-loc">Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="job-badges">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: badge.bg,
                            borderColor: badge.border,
                            color: badge.color,
                          }}
                        >
                          {badge.text}
                        </span>
                      </div>
                    </div>
                    {app.rejectionReason && (
                      <div style={{ marginTop: "12px", padding: "12px", background: "rgba(239,68,68,.1)", borderRadius: "12px", border: "1px solid rgba(239,68,68,.35)" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "rgba(239,68,68,.9)", marginBottom: "6px" }}>Rejection Reason</div>
                        <div style={{ fontSize: "13px", color: "rgba(239,68,68,.8)", lineHeight: "1.5" }}>
                          {app.rejectionReason}
                        </div>
                      </div>
                    )}
                    <div className="job-card-bottom">
                      <div className="job-meta">
                        <span className="meta-dot" />
                        Application rejected
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Link
                          to={`/internships/${app.internshipId._id}`}
                          className="browse-btn browse-btn--ghost"
                        >
                          View Job
                        </Link>
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
