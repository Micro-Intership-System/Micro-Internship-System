import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";
import "./css/BrowsePage.css";

type Internship = {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  duration: string;
  gold: number;
  skills?: string[];
  createdAt?: string;
};

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSavedJobs();
  }, []);

  async function loadSavedJobs() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<{ success: boolean; data: Internship[] }>("/internships");
      if (res.success) {
        setJobs(res.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading saved jobs…</div>
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
            <div className="browse-eyebrow">Bookmarked Jobs</div>
            <h1 className="browse-title">Saved Jobs</h1>
            <p className="browse-subtitle">
              Your bookmarked micro-internship opportunities
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Saved</div>
              <div className="browse-stat-value">{jobs.length}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="browse-alert" style={{ marginTop: "16px" }}>
            {error}
          </div>
        )}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>No Saved Jobs</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "20px" }}>
                You haven't saved any jobs yet. Start browsing and save opportunities you're interested in!
              </p>
              <Link to="/dashboard/student/browse" className="browse-btn browse-btn--primary">
                Browse Jobs →
              </Link>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Your Saved Jobs</h2>
              <div className="browse-results-count">{jobs.length} found</div>
            </div>

            <div className="browse-cards">
              {jobs.map((job) => (
                <article key={job._id} className="job-card">
                  <div className="job-card-top">
                    <div className="job-card-main">
                      <div className="job-title">{job.title}</div>
                      <div className="job-sub">
                        {job.companyName} · {job.location} · {job.duration}
                      </div>
                    </div>
                    <div className="job-badges">
                      <span className="badge badge--gold">{job.gold.toLocaleString()} Gold</span>
                    </div>
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {job.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="skill-pill">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="job-card-bottom">
                    <div className="job-meta">
                      <span className="meta-dot" />
                      {job.duration}
                    </div>
                    <Link
                      to={`/internships/${job._id}`}
                      className="browse-btn browse-btn--primary"
                      style={{ fontSize: "12px", padding: "8px 14px" }}
                    >
                      View Details
                    </Link>
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
