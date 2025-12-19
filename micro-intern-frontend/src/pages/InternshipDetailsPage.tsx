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
  const [previousApplication, setPreviousApplication] = useState<{ status: string; createdAt: string } | null>(null);
  const [isInRunningJobs, setIsInRunningJobs] = useState(false);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      apiGet<InternshipResponse>(`/internships/${id}`),
      apiGet<{ success: boolean; data: Array<{ status: string; createdAt: string; internshipId: { _id: string } | string }> }>("/applications/me").catch(() => ({ success: false, data: [] })),
      apiGet<{ success: boolean; data: Array<{ _id: string }> }>("/jobs/running").catch(() => ({ success: false, data: [] })),
    ])
      .then(([jobRes, appsRes, runningJobsRes]) => {
        if (jobRes.success) {
          setJob(jobRes.data);
          
          // Check if this job is in running jobs
          const isInRunningJobs = runningJobsRes.success && runningJobsRes.data.some(
            (runningJob) => runningJob._id === id
          );
          setIsInRunningJobs(isInRunningJobs);
          
          // Check if user has a previous application for this job
          if (appsRes.success && appsRes.data) {
            const prevApp = appsRes.data.find((app) => {
              const internshipId = typeof app.internshipId === "string" 
                ? app.internshipId 
                : app.internshipId._id;
              return internshipId === id;
            });
            if (prevApp) {
              setPreviousApplication(prevApp);
              // Mark as applied if status is not rejected (applied, accepted, evaluating)
              if (prevApp.status !== "rejected") {
                setApplied(true);
              } else {
                setApplied(false);
              }
            } else {
              setPreviousApplication(null);
              setApplied(false);
            }
          } else {
            setPreviousApplication(null);
            setApplied(false);
          }
        }
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

      // After successful application, mark as applied
      setApplied(true);
      setPreviousApplication({ status: "applied", createdAt: new Date().toISOString() });
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
          <div className="browse-alert" style={{ marginTop: "16px" }}>
            Job not found.
          </div>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginTop: "16px" }}>
          {/* Left Column - Description & Skills */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            {/* Description */}
            <section className="browse-panel">
              <div className="browse-panel-head">
                <h2 className="browse-panel-title">Description</h2>
              </div>
              <div style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--text)", whiteSpace: "pre-line" }}>
                {job.description || "No description provided."}
              </div>
            </section>

            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <section className="browse-panel">
                <div className="browse-panel-head">
                  <h2 className="browse-panel-title">Required Skills</h2>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {job.skills.map((skill, index) => (
                    <span key={index} className="skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Details & Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            {/* Job Details */}
            <section className="browse-panel">
              <div className="browse-panel-head">
                <h2 className="browse-panel-title">Job Details</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div className="browse-stat-label" style={{ marginBottom: "6px" }}>Location</div>
                  <div style={{ fontSize: "14px", fontWeight: 800 }}>{job.location}</div>
                </div>
                <div>
                  <div className="browse-stat-label" style={{ marginBottom: "6px" }}>Duration</div>
                  <div style={{ fontSize: "14px", fontWeight: 800 }}>{job.duration}</div>
                </div>
                <div>
                  <div className="browse-stat-label" style={{ marginBottom: "6px" }}>Gold Reward</div>
                  <div className="browse-stat-value" style={{ margin: 0, fontSize: "20px" }}>
                    {job.gold.toLocaleString()} Gold
                  </div>
                </div>
              </div>
            </section>

            {/* Apply Now */}
            <section className="browse-panel">
              <div className="browse-panel-head">
                <h2 className="browse-panel-title">Apply Now</h2>
              </div>
              {applied && (
                <div style={{ 
                  marginBottom: "16px", 
                  padding: "12px", 
                  background: "rgba(59,130,246,.1)", 
                  border: "1px solid rgba(59,130,246,.3)", 
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "var(--text)",
                  textAlign: "center"
                }}>
                  Already applied
                </div>
              )}
              {previousApplication && previousApplication.status === "rejected" && (
                <div style={{ 
                  marginBottom: "16px", 
                  padding: "12px", 
                  background: "rgba(251,191,36,.1)", 
                  border: "1px solid rgba(251,191,36,.3)", 
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "var(--text)"
                }}>
                  <div style={{ fontWeight: 800, marginBottom: "4px" }}>Previously Rejected</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    You can apply again. Previous application was rejected on {new Date(previousApplication.createdAt).toLocaleDateString()}.
                  </div>
                </div>
              )}
              {error && (
                <div className="browse-alert" style={{ marginBottom: "16px" }}>
                  {error}
                </div>
              )}
              <button
                onClick={apply}
                disabled={applied || applying || isInRunningJobs}
                className="browse-btn browse-btn--primary"
                style={{ width: "100%", fontSize: "14px", padding: "12px 20px" }}
              >
                {applied
                  ? "Applied ✓" 
                  : applying 
                    ? "Applying…" 
                    : previousApplication && previousApplication.status === "rejected"
                      ? "Apply Again"
                      : isInRunningJobs
                        ? "Job in Progress"
                        : "Apply Now"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
