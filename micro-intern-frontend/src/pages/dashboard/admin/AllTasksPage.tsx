import { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../../../api/client";
import "../student/css/BrowsePage.css";

type Task = {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  duration: string;
  gold: number;
  status: string;
  priorityLevel: string;
  deadline?: string;
  employerId: { _id: string; name: string };
  acceptedStudentId?: { _id: string; name: string };
  createdAt: string;
};

export default function AllTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ status?: string; priority?: string }>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTasks();
  }, [filter]);

  async function loadTasks() {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filter.status) query.append("status", filter.status);
      if (filter.priority) query.append("priorityLevel", filter.priority);

      const res = await apiGet<{ success: boolean; data: Task[] }>(
        `/internships?${query.toString()}`
      );
      if (res.success) {
        setTasks(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this job? This will permanently delete the job and all related data (applications, payments, messages, etc.).")) {
      return;
    }

    try {
      await apiDelete(`/admin/jobs/${taskId}`);
      alert("Job deleted successfully");
      await loadTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete job");
    }
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, { style: React.CSSProperties }> = {
      posted: { style: { borderColor: "rgba(59,130,246,.35)", background: "rgba(59,130,246,.16)", color: "#3b82f6" } },
      in_progress: { style: { borderColor: "rgba(251,191,36,.35)", background: "rgba(251,191,36,.16)", color: "#fbbf24" } },
      completed: { style: { borderColor: "rgba(34,197,94,.35)", background: "rgba(34,197,94,.16)", color: "#22c55e" } },
      cancelled: { style: { borderColor: "rgba(239,68,68,.35)", background: "rgba(239,68,68,.16)", color: "#ef4444" } },
    };
    return badges[status] || { style: { borderColor: "var(--border)", background: "rgba(255,255,255,.05)", color: "var(--text)" } };
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading tasks…</div>
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
            <div className="browse-eyebrow">Task Management</div>
            <h1 className="browse-title">All Tasks</h1>
            <p className="browse-subtitle">
              Monitor all micro-internship tasks across the platform. View status, assignments, and details.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Total Tasks</div>
              <div className="browse-stat-value">{tasks.length}</div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Filters</h2>
            <div className="browse-panel-subtitle">Narrow down tasks</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div className="browse-field">
              <label className="browse-label">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="browse-input"
              />
            </div>
            <div className="browse-field">
              <label className="browse-label">Status</label>
              <select
                value={filter.status || ""}
                onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
                className="browse-select"
              >
                <option value="">All Status</option>
                <option value="posted">Posted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="browse-field">
              <label className="browse-label">Priority</label>
              <select
                value={filter.priority || ""}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value || undefined })}
                className="browse-select"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </section>

        {/* Tasks Table */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Tasks</h2>
            <div className="browse-panel-subtitle">{filteredTasks.length} found</div>
          </div>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
              No tasks found
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Task</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Company</th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Gold</th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Student</th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Created</th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const badge = getStatusBadge(task.status);
                    return (
                      <tr
                        key={task._id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: "4px" }}>{task.title}</div>
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>{task.location} • {task.duration}</div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontSize: "14px" }}>{task.companyName}</div>
                        </td>
                        <td style={{ padding: "16px", textAlign: "center", fontWeight: 800 }}>
                          {task.gold.toLocaleString()} Gold
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <span className="badge" style={badge.style}>
                            {task.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <span style={{ fontSize: "14px" }}>
                            {task.acceptedStudentId ? task.acceptedStudentId.name : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="browse-btn"
                            style={{
                              fontSize: "11px",
                              padding: "6px 12px",
                              background: "rgba(239,68,68,.8)",
                              border: "1px solid rgba(239,68,68,.5)",
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ textAlign: "center", padding: "16px", fontSize: "12px", color: "var(--muted)", borderTop: "1px solid var(--border)", marginTop: "12px" }}>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </section>
      </div>
    </div>
  );
}
