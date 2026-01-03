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

  function getGoldRange(g: number): string {
    if (g < 500) return "<500";
    if (g < 1000) return "500-1000";
    if (g < 2000) return "1000-2000";
    if (g < 5000) return "2000-5000";
    return "5000+";
  }

  function getDurationRange(d: string): string {
    const lower = d.toLowerCase();
    if (lower.includes("week") || /\d/.test(lower)) {
      const weeks = parseInt(lower.match(/\d+/)?.[0] || "0", 10);
      if (weeks <= 1) return "1 week";
      if (weeks <= 2) return "2 weeks";
      if (weeks <= 4) return "3-4 weeks";
      return "1+ month";
    }
    if (lower.includes("month")) {
      const months = parseInt(lower.match(/\d+/)?.[0] || "0", 10);
      if (months <= 1) return "1 month";
      if (months <= 3) return "2-3 months";
      return "3+ months";
    }
    return d;
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
            <div className="browse-eyebrow">Saved Jobs</div>
            <h1 className="browse-title">Your bookmarked micro-internship opportunities</h1>
            <p className="browse-subtitle">Quick access to jobs you're interested in</p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Saved</div>
              <div className="browse-stat-value">{jobs.length}</div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && <div className="browse-alert" style={{ marginTop: "16px" }}>{error}</div>}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No Saved Jobs</div>
              <div className="browse-empty-sub">
                You haven't saved any jobs yet. Start browsing and save opportunities you're interested in!
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
              <h2 className="browse-results-title">Saved Jobs</h2>
              <div className="browse-results-count">{jobs.length} found</div>
            </div>
            <div className="browse-cards">
              {jobs.map((job) => (
                <article key={job._id} className="job-card">
                  <div className="job-card-top">
                    <div className="job-card-main">
                      <div className="job-title">{job.title}</div>
                      <div className="job-sub">
                        {job.companyName} · <span className="job-loc">{job.location}</span>
                      </div>
                    </div>
                    <div className="job-badges">
                      <span className="badge badge--gold">{getGoldRange(job.gold)} Gold</span>
                      <span className="badge badge--muted">{getDurationRange(job.duration)}</span>
                    </div>
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="job-skills">
                      {job.skills.slice(0, 4).map((s, i) => (
                        <span key={i} className="skill-pill">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="job-card-bottom">
                    <div className="job-meta">
                      <span className="meta-dot" />
                      {job.gold.toLocaleString()} Gold
                    </div>
                    <Link className="browse-btn browse-btn--primary" to={`/internships/${job._id}`}>
                      View Details →
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
