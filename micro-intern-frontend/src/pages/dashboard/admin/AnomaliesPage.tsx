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
  taskId?: { _id: string; title: string; priorityLevel?: "high" | "medium" | "low" };
  userId?: { _id: string; name: string; email: string };
  employerId?: { _id: string; name: string; email: string; companyName: string };
  studentId?: { _id: string; name: string; email: string };
};

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string; type?: string; severity?: string }>({});
  const [detecting, setDetecting] = useState(false);

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

  const [showResolveModal, setShowResolveModal] = useState<{ taskId: string; anomalyId: string } | null>(null);
  const [resolveWinner, setResolveWinner] = useState<"student" | "employer" | "">("");
  const [resolveReason, setResolveReason] = useState("");
  const [resolving, setResolving] = useState(false);

  async function resolveDispute(taskId: string, anomalyId: string, winner: "student" | "employer", reason: string) {
    try {
      setResolving(true);
      await apiPost(`/jobs/${taskId}/resolve-dispute`, { winner, reason });
      alert("Dispute resolved successfully!");
      setShowResolveModal(null);
      setResolveWinner("");
      setResolveReason("");
      await loadAnomalies();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  }

  function handleResolveClick(anomaly: Anomaly) {
    if (anomaly.taskId) {
      setShowResolveModal({ taskId: anomaly.taskId._id, anomalyId: anomaly._id });
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

  function getSeverityColor(severity: Anomaly["severity"]) {
    const colors: Record<string, { bg: string; border: string; color: string }> = {
      low: { bg: "rgba(59,130,246,.16)", border: "rgba(59,130,246,.35)", color: "rgba(59,130,246,.9)" },
      medium: { bg: "rgba(251,191,36,.16)", border: "rgba(251,191,36,.35)", color: "rgba(251,191,36,.9)" },
      high: { bg: "rgba(239,68,68,.16)", border: "rgba(239,68,68,.35)", color: "rgba(239,68,68,.9)" },
      critical: { bg: "rgba(239,68,68,.25)", border: "rgba(239,68,68,.5)", color: "rgba(239,68,68,1)" },
    };
    return colors[severity] || colors.low;
  }

  function getStatusColor(status: Anomaly["status"]) {
    const colors: Record<string, { bg: string; border: string; color: string }> = {
      open: { bg: "rgba(239,68,68,.16)", border: "rgba(239,68,68,.35)", color: "rgba(239,68,68,.9)" },
      investigating: { bg: "rgba(251,191,36,.16)", border: "rgba(251,191,36,.35)", color: "rgba(251,191,36,.9)" },
      resolved: { bg: "rgba(34,197,94,.16)", border: "rgba(34,197,94,.35)", color: "rgba(34,197,94,.9)" },
      dismissed: { bg: "rgba(255,255,255,.1)", border: "var(--border)", color: "var(--muted)" },
    };
    return colors[status] || colors.open;
  }

  function getPriorityColor(priority?: "high" | "medium" | "low") {
    const colors: Record<string, { bg: string; border: string; color: string }> = {
      high: { bg: "rgba(239,68,68,.16)", border: "rgba(239,68,68,.35)", color: "rgba(239,68,68,.9)" },
      medium: { bg: "rgba(251,191,36,.16)", border: "rgba(251,191,36,.35)", color: "rgba(251,191,36,.9)" },
      low: { bg: "rgba(59,130,246,.16)", border: "rgba(59,130,246,.35)", color: "rgba(59,130,246,.9)" },
    };
    return colors[priority || "medium"] || colors.medium;
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
            <div className="browse-eyebrow">Admin</div>
            <h1 className="browse-title">Anomaly Detection</h1>
            <p className="browse-subtitle">Monitor and resolve system anomalies</p>
          </div>
          <div className="browse-actions">
            <button
              onClick={runDetection}
              disabled={detecting}
              className="browse-btn browse-btn--primary"
              style={{ opacity: detecting ? 0.5 : 1 }}
            >
              {detecting ? "Detecting..." : "Run Detection"}
            </button>
          </div>
        </header>

        {/* Filters */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <select
              value={filter.status || ""}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
              className="browse-input"
              style={{ flex: "1", minWidth: "150px" }}
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>

            <select
              value={filter.type || ""}
              onChange={(e) => setFilter({ ...filter, type: e.target.value || undefined })}
              className="browse-input"
              style={{ flex: "1", minWidth: "150px" }}
            >
              <option value="">All Types</option>
              <option value="missed_deadline">Missed Deadline</option>
              <option value="delayed_payment">Delayed Payment</option>
              <option value="employer_inactivity">Employer Inactivity</option>
              <option value="student_overwork">Student Overwork</option>
              <option value="task_stalled">Task Stalled</option>
            </select>

            <select
              value={filter.severity || ""}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value || undefined })}
              className="browse-input"
              style={{ flex: "1", minWidth: "150px" }}
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </section>

        {/* Anomalies List */}
        {anomalies.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No anomalies found</div>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Anomalies</h2>
              <div className="browse-results-count">{anomalies.length} found</div>
            </div>
            <div className="browse-cards">
              {anomalies.map((anomaly) => {
                const severityColors = getSeverityColor(anomaly.severity);
                const statusColors = getStatusColor(anomaly.status);
                return (
                  <article key={anomaly._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                          <span className="badge" style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}>
                            {getTypeLabel(anomaly.type)}
                          </span>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: severityColors.bg,
                              borderColor: severityColors.border,
                              color: severityColors.color,
                            }}
                          >
                            {anomaly.severity.toUpperCase()}
                          </span>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: statusColors.bg,
                              borderColor: statusColors.border,
                              color: statusColors.color,
                            }}
                          >
                            {anomaly.status}
                          </span>
                          {anomaly.taskId?.priorityLevel && (() => {
                            const priorityColors = getPriorityColor(anomaly.taskId.priorityLevel);
                            return (
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: priorityColors.bg,
                                  borderColor: priorityColors.border,
                                  color: priorityColors.color,
                                }}
                              >
                                Priority: {anomaly.taskId.priorityLevel.toUpperCase()}
                              </span>
                            );
                          })()}
                        </div>
                        <p style={{ fontSize: "14px", color: "var(--text)", marginBottom: "12px", lineHeight: "1.6" }}>
                          {anomaly.description}
                        </p>
                        <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {anomaly.taskId && (
                            <div>Task: <span style={{ fontWeight: "600", color: "var(--text)" }}>{anomaly.taskId.title}</span></div>
                          )}
                          {anomaly.employerId && (
                            <div>Employer: <span style={{ fontWeight: "600", color: "var(--text)" }}>{anomaly.employerId.companyName || anomaly.employerId.name}</span></div>
                          )}
                          {anomaly.studentId && (
                            <div>Student: <span style={{ fontWeight: "600", color: "var(--text)" }}>{anomaly.studentId.name}</span></div>
                          )}
                          <div>Detected: {new Date(anomaly.detectedAt).toLocaleString()}</div>
                          {anomaly.resolvedAt && (
                            <div>Resolved: {new Date(anomaly.resolvedAt).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                      {anomaly.status !== "resolved" && anomaly.status !== "dismissed" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
                          {anomaly.taskId && (
                            <>
                              <Link
                                to={`/dashboard/admin/chats?taskId=${anomaly.taskId._id}`}
                                className="browse-btn browse-btn--ghost"
                                style={{ textAlign: "center", textDecoration: "none" }}
                              >
                                Chat
                              </Link>
                              <button
                                onClick={() => handleResolveClick(anomaly)}
                                className="browse-btn browse-btn--primary"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                          {!anomaly.taskId && (
                            <button
                              onClick={() => resolveAnomaly(anomaly._id)}
                              className="browse-btn browse-btn--primary"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Resolve Modal */}
        {showResolveModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => {
              if (!resolving) {
                setShowResolveModal(null);
                setResolveWinner("");
                setResolveReason("");
              }
            }}
          >
            <div
              className="browse-panel"
              style={{
                maxWidth: "500px",
                width: "100%",
                margin: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>
                Resolve Dispute
              </h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "20px" }}>
                Choose the winner of this dispute. The student will receive 150% payment if they win, or lose 50% if they lose. The employer will receive a 7-day restriction if the student wins.
              </p>

              {/* Winner Selection */}
              <div style={{ marginBottom: "20px" }}>
                <label className="browse-label" style={{ marginBottom: "12px" }}>
                  Winner <span style={{ color: "rgba(239,68,68,.9)" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setResolveWinner("student")}
                    className="browse-btn"
                    style={{
                      flex: 1,
                      background: resolveWinner === "student" ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.05)",
                      borderColor: resolveWinner === "student" ? "rgba(34,197,94,.5)" : "var(--border)",
                      color: resolveWinner === "student" ? "rgba(34,197,94,.9)" : "var(--text)",
                    }}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolveWinner("employer")}
                    className="browse-btn"
                    style={{
                      flex: 1,
                      background: resolveWinner === "employer" ? "rgba(239,68,68,.2)" : "rgba(255,255,255,.05)",
                      borderColor: resolveWinner === "employer" ? "rgba(239,68,68,.5)" : "var(--border)",
                      color: resolveWinner === "employer" ? "rgba(239,68,68,.9)" : "var(--text)",
                    }}
                  >
                    Employer
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: "20px" }}>
                <label className="browse-label" style={{ marginBottom: "12px" }}>
                  Reason <span style={{ color: "rgba(239,68,68,.9)" }}>*</span>
                </label>
                <textarea
                  value={resolveReason}
                  onChange={(e) => setResolveReason(e.target.value)}
                  placeholder="Enter reason for resolution..."
                  rows={4}
                  className="browse-input"
                  style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowResolveModal(null);
                    setResolveWinner("");
                    setResolveReason("");
                  }}
                  className="browse-btn browse-btn--ghost"
                  style={{ flex: 1 }}
                  disabled={resolving}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!resolveWinner || !resolveReason.trim()) {
                      alert("Please select a winner and provide a reason");
                      return;
                    }
                    resolveDispute(showResolveModal.taskId, showResolveModal.anomalyId, resolveWinner as "student" | "employer", resolveReason.trim());
                  }}
                  className="browse-btn browse-btn--primary"
                  style={{ flex: 1, opacity: (!resolveWinner || !resolveReason.trim() || resolving) ? 0.5 : 1 }}
                  disabled={!resolveWinner || !resolveReason.trim() || resolving}
                >
                  {resolving ? "Resolving..." : "Confirm Resolution"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
