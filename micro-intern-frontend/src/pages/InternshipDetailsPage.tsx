import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost } from "../api/client";
import "./dashboard/student/css/BrowsePage.css";

type Internship = {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  duration: string;
  gold: number;
  skills?: string[];
  description?: string;
  updatedAt?: string;
};

type InternshipResponse = {
  success: boolean;
  data: Internship;
};

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function InternshipDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    apiGet<InternshipResponse>(`/internships/${id}`)
      .then(res => {
        if (res.success) setJob(res.data);
      })
      .catch(() => setError("Failed to load job details"))
      .finally(() => setLoading(false));
  }, [id]);

  async function apply() {
    if (!job) return;

    try {
      setApplying(true);
      setError("");

      await apiPost("/applications", {
        internshipId: job._id,
      });

      setApplied(true);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to apply.");
      }
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading job details…</div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading" style={{ color: "rgba(239,68,68,.9)" }}>Job not found.</div>
        </div>
      </div>
    );
  }

  // Unused functions - commented out for now
  // function getGoldRange(g: number): string {
  //   if (g < 500) return "<500";
  //   if (g < 1000) return "500-1000";
  //   if (g < 2000) return "1000-2000";
  //   if (g < 5000) return "2000-5000";
  //   return "5000+";
  // }

  // function getDurationRange(d: string): string {
  //   const lower = d.toLowerCase();
  //   if (lower.includes("week") || /\d/.test(lower)) {
  //     const weeks = parseInt(lower.match(/\d+/)?.[0] || "0", 10);
  //     if (weeks <= 1) return "1 week";
  //     if (weeks <= 2) return "2 weeks";
  //     if (weeks <= 4) return "3-4 weeks";
  //     return "1+ month";
  //   }
  //   if (lower.includes("month")) {
  //     const months = parseInt(lower.match(/\d+/)?.[0] || "0", 10);
  //     if (months <= 1) return "1 month";
  //     if (months <= 3) return "2-3 months";
  //     return "3+ months";
  //   }
  //   return d;
  // }

  return (
    <div className="browse-page">
      <div className="browse-inner">
        {/* Header */}
        <header className="browse-header">
          <div className="browse-title-wrap">
            <div className="browse-eyebrow">Job Details</div>
            <h1 className="browse-title">{job.title}</h1>
            <p className="browse-subtitle">
              {job.companyName} · Updated {timeAgo(job.updatedAt)}
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Gold Reward</div>
              <div className="browse-stat-value">{job.gold.toLocaleString()}</div>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
          {/* Left Column - Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <section className="browse-panel">
              <div className="browse-panel-head">
                <h2 className="browse-panel-title">Description</h2>
              </div>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,.85)", lineHeight: "1.7", whiteSpace: "pre-line", margin: 0 }}>
                {job.description || "No description provided."}
              </p>
            </section>

            {job.skills && job.skills.length > 0 && (
              <section className="browse-panel">
                <div className="browse-panel-head">
                  <h2 className="browse-panel-title">Required Skills</h2>
                </div>
                <div className="browse-chips">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="browse-chip" style={{ cursor: "default" }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Details & Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <section className="browse-panel">
              <div className="browse-panel-head">
                <h2 className="browse-panel-title">Job Details</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div className="browse-stat-label" style={{ marginBottom: "4px" }}>Location</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)" }}>{job.location}</div>
                </div>
                <div>
                  <div className="browse-stat-label" style={{ marginBottom: "4px" }}>Duration</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)" }}>{job.duration}</div>
                </div>
                <div>
                  <div className="browse-stat-label" style={{ marginBottom: "4px" }}>Gold Reward</div>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)" }}>
                    {job.gold.toLocaleString()} Gold
                  </div>
                </div>
              </div>
            </section>

            <section className="browse-panel">
              <div className="browse-panel-head">
                <h2 className="browse-panel-title">Apply Now</h2>
              </div>
              {error && (
                <div className="browse-alert" style={{ marginBottom: "16px" }}>{error}</div>
              )}
              <button
                onClick={apply}
                disabled={applied || applying}
                className="browse-btn browse-btn--primary"
                style={{ width: "100%", opacity: (applied || applying) ? 0.5 : 1 }}
              >
                {applied ? "Applied ✓" : applying ? "Applying…" : "Apply Now →"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
