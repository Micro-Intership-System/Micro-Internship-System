import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../../../api/client";

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

  async function resolveDispute(taskId: string, winner: "student" | "employer", reason: string) {
    if (!confirm(`Resolve dispute in favor of ${winner}?`)) {
      return;
    }

    try {
      await apiPost(`/jobs/${taskId}/resolve-dispute`, { winner, reason });
      alert("Dispute resolved successfully!");
      await loadAnomalies();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve dispute");
    }
  }

  function getTypeLabel(type: Anomaly["type"]) {
    const labels = {
      employer_inactivity: "Employer Inactivity",
      student_overwork: "Student Overwork",
      missed_deadline: "Missed Deadline",
      delayed_payment: "Delayed Payment",
      task_stalled: "Task Stalled",
    };
    return labels[type];
  }

  function getSeverityColor(severity: Anomaly["severity"]) {
    const colors = {
      low: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
      medium: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
      high: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
      critical: "bg-[#fecaca] text-[#7f1d1d] border-[#fca5a5]",
    };
    return colors[severity];
  }

  function getStatusColor(status: Anomaly["status"]) {
    const colors = {
      open: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
      investigating: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
      resolved: "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]",
      dismissed: "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]",
    };
    return colors[status];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading anomalies…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-[#111827] mb-3">Anomaly Detection</h1>
        <p className="text-sm text-[#6b7280] max-w-2xl mx-auto">
          Monitor and resolve system anomalies including missed deadlines, delayed payments, and user activity issues.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={runDetection}
          disabled={detecting}
          className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors disabled:opacity-50"
        >
          {detecting ? "Detecting..." : "Run Detection"}
        </button>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={filter.status || ""}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            className="px-3 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
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
            className="px-3 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
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
            className="px-3 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <div className="border border-[#e5e7eb] rounded-lg bg-white p-12 text-center">
            <p className="text-sm text-[#6b7280]">No anomalies found</p>
          </div>
        ) : (
          anomalies.map((anomaly) => (
            <div
              key={anomaly._id}
              className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-6 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getTypeLabel(anomaly.type).includes("Deadline") || getTypeLabel(anomaly.type).includes("Payment") ? "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]" : "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]"}`}>
                      {getTypeLabel(anomaly.type)}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(anomaly.status)}`}>
                      {anomaly.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#111827] mb-3">{anomaly.description}</p>
                  <div className="text-xs text-[#6b7280] space-y-1">
                    {anomaly.taskId && (
                      <div>Task: <span className="font-medium">{anomaly.taskId.title}</span></div>
                    )}
                    {anomaly.employerId && (
                      <div>Employer: <span className="font-medium">{anomaly.employerId.companyName || anomaly.employerId.name}</span></div>
                    )}
                    {anomaly.studentId && (
                      <div>Student: <span className="font-medium">{anomaly.studentId.name}</span></div>
                    )}
                    <div>Detected: {new Date(anomaly.detectedAt).toLocaleString()}</div>
                    {anomaly.resolvedAt && (
                      <div>Resolved: {new Date(anomaly.resolvedAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>
                {anomaly.status !== "resolved" && anomaly.status !== "dismissed" && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => resolveAnomaly(anomaly._id)}
                      className="px-4 py-2 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors whitespace-nowrap"
                    >
                      Resolve Anomaly
                    </button>
                    {anomaly.taskId && (
                      <button
                        onClick={() => {
                          const winner = prompt("Resolve dispute in favor of (student/employer):");
                          if (winner === "student" || winner === "employer") {
                            const reason = prompt("Reason for resolution:");
                            if (reason) {
                              resolveDispute(anomaly.taskId!._id, winner, reason);
                            }
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-[#065f46] text-white text-sm font-semibold hover:bg-[#047857] transition-colors whitespace-nowrap"
                      >
                        Resolve Dispute
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


