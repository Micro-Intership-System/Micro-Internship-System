import { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";
import { Link } from "react-router-dom";
import "../student/css/BrowsePage.css";

type Stats = {
  totalStudents: number;
  totalEmployers: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalAnomalies: number;
  openAnomalies: number;
  totalPayments: number;
  pendingPayments: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalEmployers: 0,
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalAnomalies: 0,
    openAnomalies: 0,
    totalPayments: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Refresh stats when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadStats();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      // Load all stats from various endpoints
      const [studentsRes, employersRes, tasksRes, anomaliesRes, paymentsRes] = await Promise.all([
        apiGet<{ success: boolean; data: any[] }>("/student/all").catch((err) => {
          console.error("Failed to load students:", err);
          return { success: false, data: [] };
        }),
        apiGet<{ success: boolean; data: any[] }>("/employer/all").catch((err) => {
          console.error("Failed to load employers:", err);
          return { success: false, data: [] };
        }),
        apiGet<{ success: boolean; data: any[] }>("/internships").catch((err) => {
          console.error("Failed to load tasks:", err);
          return { success: false, data: [] };
        }),
        apiGet<{ success: boolean; data: any[] }>("/anomalies").catch((err) => {
          console.error("Failed to load anomalies:", err);
          return { success: false, data: [] };
        }),
        apiGet<{ success: boolean; data: any[] }>("/payments/all").catch((err) => {
          console.error("Failed to load payments:", err);
          return { success: false, data: [] };
        }),
      ]);

      const students = studentsRes.success ? studentsRes.data : [];
      const employers = employersRes.success ? employersRes.data : [];
      const tasks = tasksRes.success ? tasksRes.data : [];
      const anomalies = anomaliesRes.success ? anomaliesRes.data : [];
      const payments = paymentsRes.success ? paymentsRes.data : [];

      // Count active tasks - jobs that are posted or in_progress (not completed or cancelled)
      const activeTasksCount = tasks.filter((t: any) => 
        t.status === "posted" || t.status === "in_progress"
      ).length;

      // Count payments by status
      const successfulPayments = payments.filter((p: any) => p.status === "released").length;
      const pendingEscrowedPayments = payments.filter((p: any) => p.status === "pending" || p.status === "escrowed").length;
      // const totalAllPayments = payments.length; // Unused variable

      setStats({
        totalStudents: students.length,
        totalEmployers: employers.length,
        totalTasks: tasks.length,
        activeTasks: activeTasksCount,
        completedTasks: tasks.filter((t: any) => t.status === "completed").length,
        totalAnomalies: anomalies.length,
        openAnomalies: anomalies.filter((a: any) => a.status === "open" || a.status === "investigating").length,
        totalPayments: successfulPayments, // Successful payments (released)
        pendingPayments: pendingEscrowedPayments, // Pending or escrowed payments
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading dashboard…</div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Students",
      value: stats.totalStudents,
      link: "/dashboard/admin/students",
      color: "rgba(124,58,237,.16)",
      borderColor: "rgba(124,58,237,.35)",
    },
    {
      label: "Total Employers",
      value: stats.totalEmployers,
      link: "/dashboard/admin/employers",
      color: "rgba(59,130,246,.16)",
      borderColor: "rgba(59,130,246,.35)",
    },
    {
      label: "Active Tasks",
      value: stats.activeTasks,
      link: "/dashboard/admin/tasks",
      color: "rgba(251,191,36,.16)",
      borderColor: "rgba(251,191,36,.35)",
    },
    {
      label: "Open Anomalies",
      value: stats.openAnomalies,
      link: "/dashboard/admin/anomalies",
      color: stats.openAnomalies > 0 ? "rgba(239,68,68,.16)" : "rgba(34,197,94,.16)",
      borderColor: stats.openAnomalies > 0 ? "rgba(239,68,68,.35)" : "rgba(34,197,94,.35)",
    },
  ];

  return (
    <div className="browse-page">
      <div className="browse-inner">
        {/* Header */}
        <header className="browse-header">
          <div className="browse-title-wrap">
            <div className="browse-eyebrow">Admin Dashboard</div>
            <h1 className="browse-title">Platform Overview</h1>
            <p className="browse-subtitle">Monitor and manage the entire Micro-Internship platform</p>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Statistics</h2>
            <div className="browse-panel-subtitle">Key platform metrics</div>
          </div>
          <div className="browse-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {statCards.map((stat, index) => (
              <Link key={index} to={stat.link} className="job-card" style={{ textDecoration: "none" }}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      margin: "0 auto 12px",
                      borderRadius: "var(--r-md)",
                      background: stat.color,
                      border: `1px solid ${stat.borderColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "var(--text)",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="browse-stat-label">{stat.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Overview Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginTop: "16px" }}>
          {/* Anomalies Card */}
          <section className="browse-panel">
            <div className="browse-panel-head">
              <h2 className="browse-panel-title">Anomaly Detection</h2>
              <Link to="/dashboard/admin/anomalies" className="browse-link" style={{ fontSize: "12px" }}>
                View all →
              </Link>
            </div>
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                Monitor system anomalies including missed deadlines, delayed payments, and user inactivity.
              </p>
              <div style={{ display: "flex", gap: "24px" }}>
                <div style={{ textAlign: "center" }}>
                  <div className="browse-stat-value" style={{ fontSize: "28px", marginBottom: "4px" }}>
                    {stats.openAnomalies}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Open Issues</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="browse-stat-value" style={{ fontSize: "28px", marginBottom: "4px" }}>
                    {stats.totalAnomalies}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Total Detected</div>
                </div>
              </div>
            </div>
          </section>

          {/* Tasks Overview */}
          <section className="browse-panel">
            <div className="browse-panel-head">
              <h2 className="browse-panel-title">Tasks Overview</h2>
              <Link to="/dashboard/admin/tasks" className="browse-link" style={{ fontSize: "12px" }}>
                View all →
              </Link>
            </div>
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                Track all micro-internship tasks across the platform.
              </p>
              <div style={{ display: "flex", gap: "24px" }}>
                <div style={{ textAlign: "center" }}>
                  <div className="browse-stat-value" style={{ fontSize: "28px", marginBottom: "4px" }}>
                    {stats.activeTasks}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Active</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="browse-stat-value" style={{ fontSize: "28px", marginBottom: "4px" }}>
                    {stats.completedTasks}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Completed</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="browse-stat-value" style={{ fontSize: "28px", marginBottom: "4px" }}>
                    {stats.totalTasks}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Total</div>
                </div>
              </div>
            </div>
          </section>

          {/* Payments Overview */}
          <section className="browse-panel">
            <div className="browse-panel-head">
              <h2 className="browse-panel-title">Payments</h2>
            </div>
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                Monitor payment status and escrow transactions.
              </p>
              <div style={{ display: "flex", gap: "24px" }}>
                <div style={{ textAlign: "center" }}>
                  <div className="browse-stat-value" style={{ fontSize: "28px", marginBottom: "4px" }}>
                    {stats.pendingPayments}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Pending/Escrowed</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="browse-stat-value" style={{ fontSize: "28px", marginBottom: "4px" }}>
                    {stats.totalPayments}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Successful</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="browse-stat-value" style={{ fontSize: "28px", marginBottom: "4px" }}>
                    {stats.pendingPayments + stats.totalPayments}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Total</div>
                </div>
              </div>
            </div>
          </section>

          {/* User Management */}
          <section className="browse-panel">
            <div className="browse-panel-head">
              <h2 className="browse-panel-title">User Management</h2>
            </div>
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                Manage students and employers on the platform.
              </p>
              <div style={{ display: "flex", gap: "24px" }}>
                <div style={{ textAlign: "center" }}>
                  <div className="browse-stat-value" style={{ fontSize: "28px", marginBottom: "4px" }}>
                    {stats.totalStudents}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Students</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div className="browse-stat-value" style={{ fontSize: "28px", marginBottom: "4px" }}>
                    {stats.totalEmployers}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>Employers</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
