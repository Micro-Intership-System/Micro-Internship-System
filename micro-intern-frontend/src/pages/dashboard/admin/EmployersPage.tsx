import { useEffect, useState } from "react";
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
            <div className="browse-eyebrow">Employer Management</div>
            <h1 className="browse-title">All Employers</h1>
            <p className="browse-subtitle">
              Search and manage all employers on the platform. View their companies, verification status, and activity.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Total Employers</div>
              <div className="browse-stat-value">{employers.length}</div>
            </div>
          </div>
        </header>

        {/* Search */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-field">
            <label className="browse-label">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or company..."
              className="browse-input"
            />
          </div>
        </section>

        {/* Employers Grid */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Employers</h2>
            <div className="browse-panel-subtitle">{filteredEmployers.length} found</div>
          </div>
          {filteredEmployers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
              {searchQuery ? "No employers found matching your search" : "No employers found"}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
              {filteredEmployers.map((employer) => (
                <div key={employer._id} className="job-card">
                  <div style={{ display: "flex", alignItems: "start", gap: "12px", marginBottom: "16px" }}>
                    {employer.profilePicture ? (
                      <img
                        src={employer.profilePicture}
                        alt={employer.name}
                        style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "16px", flexShrink: 0 }}>
                        {employer.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "16px", marginBottom: "4px" }}>{employer.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>{employer.email}</div>
                      {employer.companyName && (
                        <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "4px" }}>{employer.companyName}</div>
                      )}
                      {employer.companyDescription && (
                        <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {employer.companyDescription}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)", marginBottom: "12px" }}>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div className="browse-stat-value" style={{ margin: "0", fontSize: "18px" }}>{employer.totalTasksPosted || 0}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Tasks Posted</div>
                    </div>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div className="browse-stat-value" style={{ margin: "0", fontSize: "18px" }}>{employer.totalPaymentsMade || 0}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Payments Made</div>
                    </div>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <span className="badge" style={{
                        borderColor: employer.verificationStatus === "verified" ? "rgba(34,197,94,.35)" : "rgba(251,191,36,.35)",
                        background: employer.verificationStatus === "verified" ? "rgba(34,197,94,.16)" : "rgba(251,191,36,.16)",
                        color: employer.verificationStatus === "verified" ? "#22c55e" : "#fbbf24",
                        fontSize: "11px",
                      }}>
                        {employer.verificationStatus || "Pending"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEmployer(employer._id)}
                    className="browse-btn"
                    style={{
                      width: "100%",
                      fontSize: "12px",
                      padding: "8px 14px",
                      background: "rgba(239,68,68,.8)",
                      border: "1px solid rgba(239,68,68,.5)",
                    }}
                  >
                    Delete Employer
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ textAlign: "center", padding: "16px", fontSize: "12px", color: "var(--muted)", borderTop: "1px solid var(--border)", marginTop: "12px" }}>
            Showing {filteredEmployers.length} of {employers.length} employers
          </div>
        </section>
      </div>
    </div>
  );
}
