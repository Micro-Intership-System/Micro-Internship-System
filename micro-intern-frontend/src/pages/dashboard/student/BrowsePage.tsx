import React, { useEffect, useMemo, useState } from "react";
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
  tags?: string[];
  priorityLevel?: "high" | "medium" | "low";
  createdAt?: string;
  bannerUrl?: string;
  employerId?: string;
};

export default function BrowsePage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [gold, setGold] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    loadInternships();
  }, []);

  async function loadInternships() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<{ success: boolean; data: Internship[] }>("/internships");
      const validJobs = (res.data || []).filter((job) => job.employerId);
      setInternships(validJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  const allSkills = useMemo(
    () => Array.from(new Set(internships.flatMap((job) => job.skills || []))),
    [internships]
  );

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

  const filteredJobs = useMemo(() => {
    return internships.filter((job) => {
      if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      if (selectedSkills.length > 0) {
        const jobSkills = job.skills || [];
        if (!selectedSkills.some((s) => jobSkills.includes(s))) return false;
      }

      if (duration && getDurationRange(job.duration) !== duration) return false;
      if (gold && getGoldRange(job.gold) !== gold) return false;

      if (location && !job.location.toLowerCase().includes(location.toLowerCase())) return false;
      return true;
    });
  }, [internships, searchQuery, selectedSkills, duration, gold, location]);

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading jobs…</div>
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
            <div className="browse-eyebrow">Browse micro-internships</div>
            <h1 className="browse-title">Find a role that matches your skills.</h1>
            <p className="browse-subtitle">
              Search, filter, and apply in minutes. Short projects, real experience, clear rewards.
            </p>
          </div>

          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Matches</div>
              <div className="browse-stat-value">{filteredJobs.length}</div>
            </div>
            <button className="browse-btn browse-btn--ghost" onClick={loadInternships}>
              Refresh
            </button>
          </div>
        </header>

        {/* Filters */}
        <section className="browse-panel">
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Filters</h2>
            <div className="browse-panel-subtitle">Narrow down opportunities fast</div>
          </div>

          <div className="browse-search-row">
            <div className="browse-field">
              <label className="browse-label">Search</label>
              <input
                className="browse-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title…"
              />
            </div>
          </div>

          <div className="browse-grid-3">
            <div className="browse-field">
              <label className="browse-label">Duration</label>
              <select className="browse-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="">All</option>
                <option value="1 week">1 Week</option>
                <option value="2 weeks">2 Weeks</option>
                <option value="3-4 weeks">3–4 Weeks</option>
                <option value="1 month">1 Month</option>
                <option value="2-3 months">2–3 Months</option>
                <option value="3+ months">3+ Months</option>
              </select>
            </div>

            <div className="browse-field">
              <label className="browse-label">Gold</label>
              <select className="browse-select" value={gold} onChange={(e) => setGold(e.target.value)}>
                <option value="">All</option>
                <option value="<500">&lt;500</option>
                <option value="500-1000">500–1,000</option>
                <option value="1000-2000">1,000–2,000</option>
                <option value="2000-5000">2,000–5,000</option>
                <option value="5000+">5,000+</option>
              </select>
            </div>

            <div className="browse-field">
              <label className="browse-label">Location</label>
              <select className="browse-select" value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">All</option>
                <option value="remote">Remote</option>
                <option value="dhaka">Dhaka</option>
                <option value="chittagong">Chittagong</option>
              </select>
            </div>
          </div>

          {allSkills.length > 0 && (
            <div className="browse-skills">
              <div className="browse-skills-head">
                <span className="browse-label">Skill tags</span>
                {selectedSkills.length > 0 && (
                  <button className="browse-link" onClick={() => setSelectedSkills([])}>
                    Clear
                  </button>
                )}
              </div>

              <div className="browse-chips">
                {allSkills.slice(0, 10).map((skill) => {
                  const active = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`browse-chip ${active ? "is-active" : ""}`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Error */}
        {error && <div className="browse-alert">{error}</div>}

        {/* Results */}
        <section className="browse-results">
          <div className="browse-results-head">
            <h2 className="browse-results-title">Available jobs</h2>
            <div className="browse-results-count">{filteredJobs.length} found</div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="browse-empty">
              <div className="browse-empty-title">No jobs match your filters</div>
              <div className="browse-empty-sub">Try removing a filter or searching something else.</div>
            </div>
          ) : (
            <div className="browse-cards">
              {filteredJobs.map((job) => (
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
                      Quick apply
                      <span className="meta-dot" />
                      Verified employer
                    </div>

                    <Link className="browse-btn browse-btn--primary" to={`/internships/${job._id}`}>
                      Apply now →
                    </Link>
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
