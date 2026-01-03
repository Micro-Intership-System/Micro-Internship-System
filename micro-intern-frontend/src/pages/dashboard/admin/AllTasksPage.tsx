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

  const filteredTasks = tasks.filter((task) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter (already applied on backend, but double-check for consistency)
    const matchesStatus = !filter.status || task.status === filter.status;
    
    // Priority filter (already applied on backend, but double-check for consistency)
    const matchesPriority = !filter.priority || task.priorityLevel === filter.priority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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

  function getStatusColor(status: string) {
    const colors: Record<string, { bg: string; border: string; color: string }> = {
      posted: { bg: "rgba(59,130,246,.16)", border: "rgba(59,130,246,.35)", color: "rgba(59,130,246,.9)" },
      in_progress: { bg: "rgba(251,191,36,.16)", border: "rgba(251,191,36,.35)", color: "rgba(251,191,36,.9)" },
      completed: { bg: "rgba(34,197,94,.16)", border: "rgba(34,197,94,.35)", color: "rgba(34,197,94,.9)" },
      cancelled: { bg: "rgba(239,68,68,.16)", border: "rgba(239,68,68,.35)", color: "rgba(239,68,68,.9)" },
    };
    return colors[status] || { bg: "var(--panel)", border: "var(--border)", color: "var(--text)" };
  }

  function getPriorityColor(priority: string) {
    const colors: Record<string, { bg: string; border: string; color: string }> = {
      high: { bg: "rgba(239,68,68,.16)", border: "rgba(239,68,68,.35)", color: "rgba(239,68,68,.9)" },
      medium: { bg: "rgba(251,191,36,.16)", border: "rgba(251,191,36,.35)", color: "rgba(251,191,36,.9)" },
      low: { bg: "rgba(59,130,246,.16)", border: "rgba(59,130,246,.35)", color: "rgba(59,130,246,.9)" },
    };
    return colors[priority] || { bg: "var(--panel)", border: "var(--border)", color: "var(--text)" };
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
            <div className="browse-eyebrow">Admin</div>
            <h1 className="browse-title">All Tasks</h1>
            <p className="browse-subtitle">Monitor all micro-internship tasks across the platform</p>
          </div>
        </header>

        {/* Filters */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="browse-input"
              style={{ flex: "1", minWidth: "200px" }}
            />
            <select
              value={filter.status || ""}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
              className="browse-input"
              style={{ minWidth: "150px" }}
            >
              <option value="">All Status</option>
              <option value="posted">Posted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filter.priority || ""}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value || undefined })}
              className="browse-input"
              style={{ minWidth: "150px" }}
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </section>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No tasks found</div>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Tasks</h2>
              <div className="browse-results-count">{filteredTasks.length} found</div>
            </div>
            <div className="browse-cards">
              {filteredTasks.map((task) => {
                const statusColors = getStatusColor(task.status);
                const priorityColors = getPriorityColor(task.priorityLevel);
                return (
                  <article key={task._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main">
                        <div className="job-title" style={{ marginBottom: "4px" }}>
                          {task.title}
                        </div>
                        <div className="job-sub" style={{ marginBottom: "12px" }}>
                          {task.companyName} · {task.location} · {task.duration}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                          <span className="badge" style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}>
                            {task.gold.toLocaleString()} Gold
                          </span>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: statusColors.bg,
                              borderColor: statusColors.border,
                              color: statusColors.color,
                            }}
                          >
                            {task.status}
                          </span>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: priorityColors.bg,
                              borderColor: priorityColors.border,
                              color: priorityColors.color,
                            }}
                          >
                            Priority: {task.priorityLevel || "medium"}
                          </span>
                          {task.acceptedStudentId && (
                            <span className="badge" style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}>
                              Student: {task.acceptedStudentId.name}
                            </span>
                          )}
                          <span className="badge" style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--muted)", fontSize: "11px" }}>
                            Created: {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="browse-btn browse-btn--danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--muted)" }}>
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>
    </div>
  );
}
