import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiPatch } from "../../../api/client";
import "../student/css/BrowsePage.css";

type Anomaly = {
  _id: string;
  type: "employer_inactivity" | "student_overwork" | "missed_deadline" | "delayed_payment" | "task_stalled" | "company_name_change";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "dismissed";
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: { name: string; email: string };
  notes?: string;
  taskId?: { _id: string; title: string };
  userId?: { _id: string; name: string; email: string };
  employerId?: { _id: string; name: string; email: string; companyName: string };
  studentId?: { _id: string; name: string; email: string };
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string; type?: string; severity?: string }>({});
  const [detecting, setDetecting] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState<{ taskId: string; taskGold?: number } | null>(null);
  const [disputeWinner, setDisputeWinner] = useState<"student" | "employer" | "">("");
  const [disputeReason, setDisputeReason] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadAnomalies();
  }, [filter]);

  async function loadAnomalies() {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filter.status) query.append("status", filter.status);
      if (filter.type) query.append("type", filter.type);
      if (filter.severity) query.append("severity", filter.severity);

      const res = await apiGet<{ success: boolean; data: Anomaly[] }>(
        `/anomalies?${query.toString()}`
      );
      if (res.success) {
        setAnomalies(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load anomalies:", err);
    } finally {
      setLoading(false);
    }
  }

  async function runDetection() {
    try {
      setDetecting(true);
      await apiPost("/anomalies/detect", {});
      await loadAnomalies();
    } catch (err) {
      console.error("Failed to run detection:", err);
    } finally {
      setDetecting(false);
    }
  }

  async function resolveAnomaly(id: string, notes?: string) {
    try {
      await apiPatch(`/anomalies/${id}/resolve`, { notes });
      await loadAnomalies();
    } catch (err) {
      console.error("Failed to resolve anomaly:", err);
    }
  }

  async function loadTaskDetails(taskId: string) {
    try {
      const res = await apiGet<{ success: boolean; data: { gold: number } }>(`/internships/${taskId}`);
      if (res.success) {
        return res.data.gold;
      }
    } catch (err) {
      console.error("Failed to load task details:", err);
    }
    return undefined;
  }

  async function handleOpenDisputeModal(taskId: string) {
    const gold = await loadTaskDetails(taskId);
    setShowDisputeModal({ taskId, taskGold: gold });
    setDisputeWinner("");
    setDisputeReason("");
  }

  async function resolveDispute() {
    if (!showDisputeModal || !disputeWinner || !disputeReason.trim()) {
      alert("Please select a winner and provide a reason");
      return;
    }

    try {
      setResolving(true);
      const res = await apiPost<{ success: boolean; payment?: number }>(
        `/jobs/${showDisputeModal.taskId}/resolve-dispute`,
        { winner: disputeWinner, reason: disputeReason.trim() }
      );
      
      if (res.success) {
        const message = disputeWinner === "student"
          ? `Dispute resolved in favor of student. Student receives ${res.payment || 0} gold (150% reward).`
          : `Dispute resolved in favor of employer. Student loses ${showDisputeModal.taskGold ? Math.ceil(showDisputeModal.taskGold * 0.5) : 0} gold (50% penalty).`;
        alert(message);
        setShowDisputeModal(null);
        setDisputeWinner("");
        setDisputeReason("");
        await loadAnomalies();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  }

  function getTypeLabel(type: Anomaly["type"]) {
    const labels: Record<string, string> = {
      employer_inactivity: "Employer Inactivity",
      student_overwork: "Student Overwork",
      missed_deadline: "Missed Deadline",
      delayed_payment: "Delayed Payment",
      task_stalled: "Task Stalled",
      company_name_change: "Company Name Change",
    };
    return labels[type] || type;
  }

  function getSeverityBadge(severity: Anomaly["severity"]) {
    const badges: Record<string, { style: React.CSSProperties }> = {
      low: { style: { borderColor: "rgba(59,130,246,.35)", background: "rgba(59,130,246,.16)", color: "#3b82f6" } },
      medium: { style: { borderColor: "rgba(251,191,36,.35)", background: "rgba(251,191,36,.16)", color: "#fbbf24" } },
      high: { style: { borderColor: "rgba(239,68,68,.35)", background: "rgba(239,68,68,.16)", color: "#ef4444" } },
      critical: { style: { borderColor: "rgba(220,38,38,.5)", background: "rgba(220,38,38,.2)", color: "#dc2626" } },
    };
    return badges[severity] || badges.low;
  }

  function getStatusBadge(status: Anomaly["status"]) {
    const badges: Record<string, { style: React.CSSProperties }> = {
      open: { style: { borderColor: "rgba(239,68,68,.35)", background: "rgba(239,68,68,.16)", color: "#ef4444" } },
      investigating: { style: { borderColor: "rgba(251,191,36,.35)", background: "rgba(251,191,36,.16)", color: "#fbbf24" } },
      resolved: { style: { borderColor: "rgba(34,197,94,.35)", background: "rgba(34,197,94,.16)", color: "#22c55e" } },
      dismissed: { style: { borderColor: "var(--border)", background: "rgba(255,255,255,.05)", color: "var(--muted)" } },
    };
    return badges[status] || badges.open;
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading anomalies…</div>
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
            <div className="browse-eyebrow">System Monitoring</div>
            <h1 className="browse-title">Anomaly Detection</h1>
            <p className="browse-subtitle">
              Monitor and resolve system anomalies including missed deadlines, delayed payments, and user activity issues.
            </p>
          </div>
          <div className="browse-actions">
            <button
              onClick={runDetection}
              disabled={detecting}
              className="browse-btn browse-btn--primary"
              style={{ fontSize: "12px", padding: "8px 14px" }}
            >
              {detecting ? "Detecting..." : "Run Detection"}
            </button>
          </div>
        </header>

        {/* Filters */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Filters</h2>
            <div className="browse-panel-subtitle">Narrow down anomalies</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div className="browse-field">
              <label className="browse-label">Status</label>
              <select
                value={filter.status || ""}
                onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
                className="browse-select"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div className="browse-field">
              <label className="browse-label">Type</label>
              <select
                value={filter.type || ""}
                onChange={(e) => setFilter({ ...filter, type: e.target.value || undefined })}
                className="browse-select"
              >
                <option value="">All Types</option>
                <option value="missed_deadline">Missed Deadline</option>
                <option value="delayed_payment">Delayed Payment</option>
                <option value="employer_inactivity">Employer Inactivity</option>
                <option value="student_overwork">Student Overwork</option>
                <option value="task_stalled">Task Stalled</option>
              </select>
            </div>
            <div className="browse-field">
              <label className="browse-label">Severity</label>
              <select
                value={filter.severity || ""}
                onChange={(e) => setFilter({ ...filter, severity: e.target.value || undefined })}
                className="browse-select"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </section>

        {/* Anomalies List */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Anomalies</h2>
            <div className="browse-panel-subtitle">{anomalies.length} found</div>
          </div>
          {anomalies.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
              No anomalies found
            </div>
          ) : (
            <div className="browse-cards">
              {anomalies.map((anomaly) => {
                const typeLabel = getTypeLabel(anomaly.type);
                const severityBadge = getSeverityBadge(anomaly.severity);
                const statusBadge = getStatusBadge(anomaly.status);
                const isUrgent = typeLabel.includes("Deadline") || typeLabel.includes("Payment");

                return (
                  <article key={anomaly._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main">
                        <div className="job-title">{typeLabel}</div>
                        <div className="job-sub">{anomaly.description}</div>
                      </div>
                      <div className="job-badges">
                        <span className="badge" style={severityBadge.style}>
                          {anomaly.severity.toUpperCase()}
                        </span>
                        <span className="badge" style={statusBadge.style}>
                          {anomaly.status}
                        </span>
                        {isUrgent && (
                          <span className="badge" style={{ borderColor: "rgba(239,68,68,.35)", background: "rgba(239,68,68,.16)", color: "#ef4444" }}>
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {anomaly.taskId && (
                        <div>Task: <span style={{ fontWeight: 800 }}>{anomaly.taskId.title}</span></div>
                      )}
                      {anomaly.employerId && (
                        <div>Employer: <span style={{ fontWeight: 800 }}>{anomaly.employerId.companyName || anomaly.employerId.name}</span></div>
                      )}
                      {anomaly.studentId && (
                        <div>Student: <span style={{ fontWeight: 800 }}>{anomaly.studentId.name}</span></div>
                      )}
                      <div>Detected: {new Date(anomaly.detectedAt).toLocaleString()}</div>
                      {anomaly.resolvedAt && (
                        <div>Resolved: {new Date(anomaly.resolvedAt).toLocaleString()}</div>
                      )}
                    </div>

                    {anomaly.status !== "resolved" && anomaly.status !== "dismissed" && (
                      <div className="job-card-bottom" style={{ marginTop: "12px" }}>
                        <div />
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {anomaly.taskId && (
                            <>
                              <Link
                                to={`/dashboard/admin/chats?taskId=${anomaly.taskId._id}`}
                                className="browse-btn browse-btn--primary"
                                style={{ fontSize: "12px", padding: "8px 14px", textDecoration: "none", display: "inline-block" }}
                              >
                                Chat
                              </Link>
                              <button
                                onClick={() => handleOpenDisputeModal(anomaly.taskId!._id)}
                                className="browse-btn"
                                style={{
                                  fontSize: "12px",
                                  padding: "8px 14px",
                                  background: "rgba(34,197,94,.8)",
                                  border: "1px solid rgba(34,197,94,.5)",
                                }}
                              >
                                Resolve Dispute
                              </button>
                            </>
                          )}
                          {!anomaly.taskId && (
                            <button
                              onClick={() => resolveAnomaly(anomaly._id)}
                              className="browse-btn browse-btn--primary"
                              style={{ fontSize: "12px", padding: "8px 14px" }}
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Dispute Resolution Modal */}
        {showDisputeModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
            onClick={() => {
              setShowDisputeModal(null);
              setDisputeWinner("");
              setDisputeReason("");
            }}
          >
            <div
              className="browse-panel"
              style={{ maxWidth: "600px", width: "100%", position: "relative" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 800 }}>Resolve Dispute</h3>
              <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "20px" }}>
                Choose the winner and provide a reason for the resolution
              </p>

              {showDisputeModal.taskGold && (
                <div style={{ marginBottom: "20px", padding: "12px", background: "rgba(255,255,255,.05)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "8px" }}>Job Reward: {showDisputeModal.taskGold} Gold</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div>• If <strong>Student wins</strong>: Receives {Math.ceil(showDisputeModal.taskGold * 1.5)} gold (150% reward)</div>
                    <div>• If <strong>Employer wins</strong>: Student loses {Math.ceil(showDisputeModal.taskGold * 0.5)} gold (50% penalty)</div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="browse-field">
                  <label className="browse-label">Winner</label>
                  <select
                    value={disputeWinner}
                    onChange={(e) => setDisputeWinner(e.target.value as "student" | "employer" | "")}
                    className="browse-select"
                  >
                    <option value="">Select winner...</option>
                    <option value="student">Student</option>
                    <option value="employer">Employer</option>
                  </select>
                </div>

                <div className="browse-field">
                  <label className="browse-label">Reason for Resolution</label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="browse-input"
                    rows={4}
                    style={{ resize: "vertical" }}
                    placeholder="Provide a detailed reason for the resolution decision..."
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  onClick={() => {
                    setShowDisputeModal(null);
                    setDisputeWinner("");
                    setDisputeReason("");
                  }}
                  className="browse-btn browse-btn--ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={resolveDispute}
                  disabled={resolving || !disputeWinner || !disputeReason.trim()}
                  className="browse-btn browse-btn--primary"
                >
                  {resolving ? "Resolving..." : "Resolve Dispute"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
