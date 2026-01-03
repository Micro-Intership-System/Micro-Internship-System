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
  employerRating?: number;
  employerCompletedJobs?: number;
  isFeatured?: boolean;
  status?: string;
};

type AppliedJob = {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  duration: string;
  gold: number;
  skills?: string[];
  status: string;
  createdAt: string;
};

export default function BrowsePage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [gold, setGold] = useState("");
  const [location, setLocation] = useState("");

  // Active filters (applied when user clicks "Apply Filters")
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [activeSelectedSkills, setActiveSelectedSkills] = useState<string[]>([]);
  const [activeDuration, setActiveDuration] = useState("");
  const [activeGold, setActiveGold] = useState("");
  const [activeLocation, setActiveLocation] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      
      // Load internships
      const jobsRes = await apiGet<{ success: boolean; data: Internship[] }>("/internships");
      const validJobs = (jobsRes.data || []).filter((job) => job.employerId);
      setInternships(validJobs);

      // Load applications to get applied jobs
      const appsRes = await apiGet<{ success: boolean; data: Array<{ internshipId?: { _id: string; title: string; companyName: string; location: string; duration: string; gold: number; skills?: string[] }; status: string; createdAt: string }> }>("/applications/me");
      if (appsRes.success) {
        const applied = appsRes.data
          .filter((app) => app.internshipId)
          .map((app) => {
            const task = app.internshipId!;
            return {
              _id: task._id,
              title: task.title,
              companyName: task.companyName,
              location: task.location,
              duration: task.duration,
              gold: task.gold,
              skills: task.skills,
              status: app.status,
              createdAt: app.createdAt,
            };
          });
        setAppliedJobs(applied);
      }
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

  // Extract work types from actual job locations
  const availableWorkTypes = useMemo(() => {
    const workTypes = new Set<string>();
    internships.forEach((job) => {
      const loc = job.location.toLowerCase().trim();
      if (loc === "remote" || loc.startsWith("remote")) {
        workTypes.add("remote");
      } else if (loc.startsWith("on-site") || loc.includes("on-site")) {
        workTypes.add("on-site");
      } else if (loc.startsWith("hybrid") || loc.includes("hybrid")) {
        workTypes.add("hybrid");
      } else {
        // For backward compatibility with old jobs that might not have the format
        // Try to detect if it's remote
        if (loc.includes("remote")) {
          workTypes.add("remote");
        } else {
          // Assume it's on-site if it's not remote
          workTypes.add("on-site");
        }
      }
    });
    return Array.from(workTypes);
  }, [internships]);

  // Helper function to extract work type from location string
  const getWorkType = React.useCallback((location: string): "remote" | "on-site" | "hybrid" | null => {
    if (!location) return null;
    const loc = location.toLowerCase().trim();
    if (loc === "remote" || loc.startsWith("remote")) return "remote";
    if (loc.startsWith("on-site") || loc.includes("on-site")) return "on-site";
    if (loc.startsWith("hybrid") || loc.includes("hybrid")) return "hybrid";
    // Backward compatibility
    if (loc.includes("remote")) return "remote";
    return null; // Unknown format
  }, []);

  // Helper function to format location for display
  const formatLocation = React.useCallback((location: string): string => {
    if (!location) return "";
    const loc = location.trim();
    if (loc.toLowerCase() === "remote" || loc.toLowerCase().startsWith("remote")) {
      return "Remote";
    }
    if (loc.toLowerCase().startsWith("on-site")) {
      const city = loc.replace(/^on-site\s*-\s*/i, "").trim();
      return city ? `On-site - ${city}` : "On-site";
    }
    if (loc.toLowerCase().startsWith("hybrid")) {
      const city = loc.replace(/^hybrid\s*-\s*/i, "").trim();
      return city ? `Hybrid - ${city}` : "Hybrid";
    }
    // Backward compatibility
    return loc;
  }, []);

  function getGoldRange(g: number): string {
    if (g < 500) return "<500";
    if (g < 1000) return "500-1000";
    if (g < 2000) return "1000-2000";
    if (g < 5000) return "2000-5000";
    return "5000+";
  }

  function getDurationRange(d: string): string {
    if (!d) return "";
    const lower = d.toLowerCase().trim();

    // Handle week-based durations
    if (lower.includes("week")) {
      const weekMatch = lower.match(/(\d+)\s*-\s*(\d+)\s*week/i);
      if (weekMatch) {
        const weeks1 = parseInt(weekMatch[1], 10);
        const weeks2 = parseInt(weekMatch[2], 10);
        if (weeks1 <= 1 && weeks2 <= 1) return "1 week";
        if (weeks1 <= 2 && weeks2 <= 2) return "2 weeks";
        if (weeks1 <= 3 && weeks2 <= 4) return "3-4 weeks";
        return "1+ month";
      }
      const weekNum = parseInt(lower.match(/\d+/)?.[0] || "0", 10);
      if (weekNum <= 1) return "1 week";
      if (weekNum <= 2) return "2 weeks";
      if (weekNum <= 4) return "3-4 weeks";
      return "1+ month";
    }

    // Handle month-based durations
    if (lower.includes("month")) {
      const monthMatch = lower.match(/(\d+)\s*-\s*(\d+)\s*month/i);
      if (monthMatch) {
        const months1 = parseInt(monthMatch[1], 10);
        const months2 = parseInt(monthMatch[2], 10);
        if (months1 <= 1 && months2 <= 1) return "1 month";
        if (months1 <= 2 && months2 <= 3) return "2-3 months";
        return "3+ months";
      }
      const monthNum = parseInt(lower.match(/\d+/)?.[0] || "0", 10);
      if (monthNum <= 1) return "1 month";
      if (monthNum <= 3) return "2-3 months";
      return "3+ months";
    }

    // Handle day-based durations
    if (lower.includes("day")) {
      const dayNum = parseInt(lower.match(/\d+/)?.[0] || "0", 10);
      if (dayNum <= 7) return "1 week";
      if (dayNum <= 14) return "2 weeks";
      if (dayNum <= 28) return "3-4 weeks";
      return "1+ month";
    }

    // Default fallback
    return d;
  }

  function applyFilters() {
    setActiveSearchQuery(searchQuery);
    setActiveSelectedSkills([...selectedSkills]);
    setActiveDuration(duration);
    setActiveGold(gold);
    setActiveLocation(location);
  }

  function clearFilters() {
    setSearchQuery("");
    setSelectedSkills([]);
    setDuration("");
    setGold("");
    setLocation("");
    setActiveSearchQuery("");
    setActiveSelectedSkills([]);
    setActiveDuration("");
    setActiveGold("");
    setActiveLocation("");
  }

  const appliedJobIds = useMemo(() => {
    return new Set(appliedJobs.map((job) => job._id));
  }, [appliedJobs]);

  const featuredJobs = useMemo(() => {
    return internships
      .filter((job) => job.isFeatured === true && !appliedJobIds.has(job._id) && (job.status === "posted" || !job.status))
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [internships, appliedJobIds]);

  const filteredFeaturedJobs = useMemo(() => {
    return featuredJobs.filter((job) => {
      if (activeSearchQuery && !job.title.toLowerCase().includes(activeSearchQuery.toLowerCase())) return false;

      if (activeSelectedSkills.length > 0) {
        const jobSkills = job.skills || [];
        if (!activeSelectedSkills.some((s) => jobSkills.includes(s))) return false;
      }

      if (activeDuration && getDurationRange(job.duration) !== activeDuration) return false;
      if (activeGold && getGoldRange(job.gold) !== activeGold) return false;

      if (activeLocation) {
        const jobWorkType = getWorkType(job.location);
        if (jobWorkType !== activeLocation) return false;
      }
      return true;
    });
  }, [featuredJobs, activeSearchQuery, activeSelectedSkills, activeDuration, activeGold, activeLocation, getWorkType]);

  const filteredAppliedJobs = useMemo(() => {
    return appliedJobs.filter((job) => {
      if (activeSearchQuery && !job.title.toLowerCase().includes(activeSearchQuery.toLowerCase())) return false;

      if (activeSelectedSkills.length > 0) {
        const jobSkills = job.skills || [];
        if (!activeSelectedSkills.some((s) => jobSkills.includes(s))) return false;
      }

      if (activeDuration && getDurationRange(job.duration) !== activeDuration) return false;
      if (activeGold && getGoldRange(job.gold) !== activeGold) return false;

      if (activeLocation) {
        const jobWorkType = getWorkType(job.location);
        if (jobWorkType !== activeLocation) return false;
      }
      return true;
    });
  }, [appliedJobs, activeSearchQuery, activeSelectedSkills, activeDuration, activeGold, activeLocation, getWorkType]);

  // All other jobs (not featured, not applied)
  const allOtherJobs = useMemo(() => {
    return internships.filter((job) => {
      // Not featured
      if (job.isFeatured === true) return false;
      // Not already applied
      if (appliedJobIds.has(job._id)) return false;
      // Only show posted jobs
      if (job.status && job.status !== "posted") return false;
      return true;
    });
  }, [internships, appliedJobIds]);

  const filteredAllOtherJobs = useMemo(() => {
    return allOtherJobs.filter((job) => {
      if (activeSearchQuery && !job.title.toLowerCase().includes(activeSearchQuery.toLowerCase())) return false;

      if (activeSelectedSkills.length > 0) {
        const jobSkills = job.skills || [];
        if (!activeSelectedSkills.some((s) => jobSkills.includes(s))) return false;
      }

      if (activeDuration && getDurationRange(job.duration) !== activeDuration) return false;
      if (activeGold && getGoldRange(job.gold) !== activeGold) return false;

      if (activeLocation) {
        const jobWorkType = getWorkType(job.location);
        if (jobWorkType !== activeLocation) return false;
      }
      return true;
    });
  }, [allOtherJobs, activeSearchQuery, activeSelectedSkills, activeDuration, activeGold, activeLocation, getWorkType]);

  function getStatusBadge(status: string) {
    const badges: Record<string, { text: string; color: string; bg: string; border: string }> = {
      accepted: { text: "Accepted", color: "rgba(34,197,94,.9)", bg: "rgba(34,197,94,.16)", border: "rgba(34,197,94,.35)" },
      evaluating: { text: "Evaluating", color: "rgba(251,191,36,.9)", bg: "rgba(251,191,36,.16)", border: "rgba(251,191,36,.35)" },
      rejected: { text: "Rejected", color: "rgba(239,68,68,.9)", bg: "rgba(239,68,68,.12)", border: "rgba(239,68,68,.35)" },
      applied: { text: "Applied", color: "rgba(59,130,246,.9)", bg: "rgba(59,130,246,.16)", border: "rgba(59,130,246,.35)" },
    };
    return badges[status] || badges.applied;
  }

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

  if (error) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-alert" style={{ marginTop: "16px" }}>{error}</div>
          <button onClick={loadData} className="browse-btn browse-btn--primary" style={{ marginTop: "16px" }}>
            Retry
          </button>
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
              <div className="browse-stat-value">{filteredFeaturedJobs.length + filteredAppliedJobs.length}</div>
            </div>
            <button className="browse-btn browse-btn--ghost" onClick={loadData}>
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
              <label className="browse-label">Work Type</label>
              <select className="browse-select" value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">All</option>
                {availableWorkTypes.includes("remote") && (
                  <option value="remote">Remote</option>
                )}
                {availableWorkTypes.includes("on-site") && (
                  <option value="on-site">On-site</option>
                )}
                {availableWorkTypes.includes("hybrid") && (
                  <option value="hybrid">Hybrid</option>
                )}
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

          {/* Filter Actions */}
          <div style={{ display: "flex", gap: "12px", marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={applyFilters}
              className="browse-btn browse-btn--primary"
              style={{ flex: 1 }}
            >
              Apply Filters
            </button>
            {(activeSearchQuery || activeSelectedSkills.length > 0 || activeDuration || activeGold || activeLocation) && (
              <button
                onClick={clearFilters}
                className="browse-btn browse-btn--ghost"
                style={{ flex: 1 }}
              >
                Clear All
              </button>
            )}
          </div>
        </section>

        {/* Error */}
        {error && <div className="browse-alert">{error}</div>}

        {/* Suggested Jobs Section */}
        {filteredFeaturedJobs.length > 0 && (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Suggested Jobs</h2>
              <div className="browse-results-count">{filteredFeaturedJobs.length} featured</div>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "8px", marginBottom: "16px" }}>
              Newly posted featured jobs you might be interested in
            </p>
            <div className="browse-cards">
              {filteredFeaturedJobs.slice(0, 6).map((job) => (
                <article key={job._id} className="job-card">
                  <div className="job-card-top">
                    <div className="job-card-main">
                      <div className="job-title">{job.title}</div>
                      <div className="job-sub">
                        {job.companyName}
                        {job.employerRating !== undefined && job.employerRating > 0 && (
                          <span style={{ marginLeft: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ color: "var(--muted)" }}>·</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  width="12"
                                  height="12"
                                  viewBox="0 0 20 20"
                                  fill={star <= Math.round(job.employerRating || 0) ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.2)"}
                                >
                                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                              ))}
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)", marginLeft: "2px" }}>
                              {job.employerRating.toFixed(1)}
                            </span>
                            {job.employerCompletedJobs !== undefined && job.employerCompletedJobs > 0 && (
                              <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "4px" }}>
                                ({job.employerCompletedJobs})
                              </span>
                            )}
                          </span>
                        )}
                        <span style={{ marginLeft: "8px", color: "var(--muted)" }}>·</span>
                        <span className="job-loc" style={{ marginLeft: "8px" }}>{formatLocation(job.location)}</span>
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
                      Featured job
                    </div>
                    <Link className="browse-btn browse-btn--primary" to={`/internships/${job._id}`}>
                      View Job →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Already Applied Jobs Section */}
        {filteredAppliedJobs.length > 0 && (
          <section className="browse-results" style={{ marginTop: filteredFeaturedJobs.length > 0 ? "32px" : "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Already Applied Jobs</h2>
              <div className="browse-results-count">{filteredAppliedJobs.length} found</div>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "8px", marginBottom: "16px" }}>
              Jobs you have already applied to
            </p>
            <div className="browse-cards">
              {filteredAppliedJobs.map((job) => {
                const badge = getStatusBadge(job.status);
                return (
                  <article key={job._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main">
                        <div className="job-title">{job.title}</div>
                        <div className="job-sub">
                          {job.companyName} · <span className="job-loc">{formatLocation(job.location)}</span>
                        </div>
                      </div>
                      <div className="job-badges">
                        <span className="badge badge--gold">{getGoldRange(job.gold)} Gold</span>
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
                        Applied: {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                      <Link className="browse-btn browse-btn--ghost" to={`/internships/${job._id}`}>
                        View Job →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* All Other Jobs Section */}
        {filteredAllOtherJobs.length > 0 && (
          <section className="browse-results" style={{ marginTop: (filteredFeaturedJobs.length > 0 || filteredAppliedJobs.length > 0) ? "32px" : "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Available Jobs</h2>
              <div className="browse-results-count">{filteredAllOtherJobs.length} found</div>
            </div>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "8px", marginBottom: "16px" }}>
              Browse all available micro-internship opportunities
            </p>
            <div className="browse-cards">
              {filteredAllOtherJobs.map((job) => (
                <article key={job._id} className="job-card">
                  <div className="job-card-top">
                    <div className="job-card-main">
                      <div className="job-title">{job.title}</div>
                      <div className="job-sub">
                        {job.companyName}
                        {job.employerRating !== undefined && job.employerRating > 0 && (
                          <span style={{ marginLeft: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ color: "var(--muted)" }}>·</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  width="12"
                                  height="12"
                                  viewBox="0 0 20 20"
                                  fill={star <= Math.round(job.employerRating || 0) ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.2)"}
                                >
                                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                              ))}
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)", marginLeft: "2px" }}>
                              {job.employerRating.toFixed(1)}
                            </span>
                            {job.employerCompletedJobs !== undefined && job.employerCompletedJobs > 0 && (
                              <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "4px" }}>
                                ({job.employerCompletedJobs})
                              </span>
                            )}
                          </span>
                        )}
                        <span style={{ marginLeft: "8px", color: "var(--muted)" }}>·</span>
                        <span className="job-loc" style={{ marginLeft: "8px" }}>{formatLocation(job.location)}</span>
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
                      {job.priorityLevel || "medium"} priority
                    </div>
                    <Link className="browse-btn browse-btn--primary" to={`/internships/${job._id}`}>
                      View Job →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Empty State if no jobs match filters */}
        {filteredFeaturedJobs.length === 0 && filteredAppliedJobs.length === 0 && filteredAllOtherJobs.length === 0 && (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No jobs match your filters</div>
              <div className="browse-empty-sub">Try adjusting your filters or clearing them to see more jobs.</div>
              {(activeSearchQuery || activeSelectedSkills.length > 0 || activeDuration || activeGold || activeLocation) && (
                <button
                  onClick={clearFilters}
                  className="browse-btn browse-btn--primary"
                  style={{ marginTop: "16px" }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
