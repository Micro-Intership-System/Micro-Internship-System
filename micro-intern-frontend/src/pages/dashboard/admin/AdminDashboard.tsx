import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../../api/client";
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
  const [cleaning, setCleaning] = useState(false);
  const [fixingRoles, setFixingRoles] = useState(false);
  const [escrowedPayments, setEscrowedPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [releasingPayment, setReleasingPayment] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadEscrowedPayments();
  }, []);

  async function fixUserRoles() {
    if (!confirm("This will fix user roles in the database to match their actual role (employer if they have companyName, student otherwise). Continue?")) {
      return;
    }

    try {
      setFixingRoles(true);
      const res = await apiPost<{ success: boolean; message: string; fixed: number; issues: string[] }>("/admin/fix-user-roles");
      if (res.success) {
        const summary = [
          `Fixed ${res.fixed} user(s)`,
          ...res.issues.slice(0, 10),
          res.issues.length > 10 ? `... and ${res.issues.length - 10} more` : "",
        ].filter(Boolean).join("\n");
        alert(`User roles fixed!\n\n${summary}`);
        await loadStats();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to fix user roles");
    } finally {
      setFixingRoles(false);
    }
  }

  async function cleanupJobs() {
    if (!confirm("This will:\n- Delete jobs that don't follow the new structure\n- Resolve disputed jobs and return coins appropriately\n- Clean up hanging jobs (stuck in certain states)\n- Handle anomaly-related jobs\n\nAll coins will be refunded to appropriate users. Continue?")) {
      return;
    }

    try {
      setCleaning(true);
      const res = await apiPost<{ 
        success: boolean; 
        message: string; 
        report: {
          invalidJobsDeleted: number;
          disputedJobsResolved: number;
          hangingJobsCleaned: number;
          coinsRefunded: number;
          coinsReturnedToStudents: number;
          coinsReturnedToEmployers: number;
          applicationsDeleted: number;
          paymentsRefunded: number;
          anomaliesResolved: number;
          chatMessagesDeleted: number;
        };
      }>("/jobs/cleanup");
      if (res.success) {
        const report = res.report;
        const summary = [
          `Invalid jobs deleted: ${report.invalidJobsDeleted}`,
          `Disputed jobs resolved: ${report.disputedJobsResolved}`,
          `Hanging jobs cleaned: ${report.hangingJobsCleaned}`,
          `Total coins refunded: ${report.coinsRefunded}`,
          `  - To students: ${report.coinsReturnedToStudents}`,
          `  - To employers: ${report.coinsReturnedToEmployers}`,
          `Applications deleted: ${report.applicationsDeleted}`,
          `Payments refunded: ${report.paymentsRefunded}`,
          `Anomalies resolved: ${report.anomaliesResolved}`,
          `Chat messages deleted: ${report.chatMessagesDeleted}`,
        ].join("\n");
        alert(`Cleanup completed successfully!\n\n${summary}`);
        await loadStats();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cleanup jobs");
    } finally {
      setCleaning(false);
    }
  }

  async function loadEscrowedPayments() {
    try {
      setLoadingPayments(true);
      const res = await apiGet<{ success: boolean; data: any[]; count: number }>("/admin/payments/escrowed");
      if (res.success) {
        setEscrowedPayments(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load escrowed payments:", err);
    } finally {
      setLoadingPayments(false);
    }
  }

  async function releasePayment(paymentId: string) {
    if (!confirm("Release this escrowed payment to the student? The student will receive the gold immediately.")) {
      return;
    }

    try {
      setReleasingPayment(paymentId);
      const res = await apiPost<{ success: boolean; data: any; studentId: string; goldAwarded: number }>(`/admin/payments/release/${paymentId}`);
      if (res.success) {
        alert(`Payment released! Student received ${res.goldAwarded} gold.`);
        await loadEscrowedPayments();
        await loadStats();
        // Trigger user data refresh for students
        window.dispatchEvent(new Event("userDataRefresh"));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to release payment");
    } finally {
      setReleasingPayment(null);
    }
  }

  async function loadStats() {
    try {
      setLoading(true);
      const [studentsRes, employersRes, tasksRes, anomaliesRes, paymentsRes] = await Promise.all([
        apiGet<{ success: boolean; data: any[] }>("/student/all").catch(() => ({ success: false, data: [] })),
        apiGet<{ success: boolean; data: any[] }>("/employer/all").catch(() => ({ success: false, data: [] })),
        apiGet<{ success: boolean; data: any[] }>("/internships").catch(() => ({ success: false, data: [] })),
        apiGet<{ success: boolean; data: any[] }>("/anomalies").catch(() => ({ success: false, data: [] })),
        apiGet<{ success: boolean; data: any[] }>("/payments/all").catch(() => ({ success: false, data: [] })),
      ]);

      const students = studentsRes.success ? studentsRes.data : [];
      const employers = employersRes.success ? employersRes.data : [];
      const tasks = tasksRes.success ? tasksRes.data : [];
      const anomalies = anomaliesRes.success ? anomaliesRes.data : [];
      const payments = paymentsRes.success ? paymentsRes.data : [];

      setStats({
        totalStudents: students.length,
        totalEmployers: employers.length,
        totalTasks: tasks.length,
        activeTasks: tasks.filter((t: any) => t.status === "in_progress").length,
        completedTasks: tasks.filter((t: any) => t.status === "completed").length,
        totalAnomalies: anomalies.length,
        openAnomalies: anomalies.filter((a: any) => a.status === "open" || a.status === "investigating").length,
        totalPayments: payments.length,
        pendingPayments: payments.filter((p: any) => p.status === "pending" || p.status === "escrowed").length,
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
    },
    {
      label: "Total Employers",
      value: stats.totalEmployers,
      link: "/dashboard/admin/employers",
    },
    {
      label: "Active Tasks",
      value: stats.activeTasks,
      link: "/dashboard/admin/tasks",
    },
    {
      label: "Open Anomalies",
      value: stats.openAnomalies,
      link: "/dashboard/admin/anomalies",
      isAlert: stats.openAnomalies > 0,
    },
  ];

  return (
    <div className="browse-page">
      <div className="browse-inner">
        {/* Header */}
        <header className="browse-header">
          <div className="browse-title-wrap">
            <div className="browse-eyebrow">Admin Dashboard</div>
            <h1 className="browse-title">Platform Management</h1>
            <p className="browse-subtitle">
              Monitor and manage the entire Micro-Internship platform. View statistics, resolve anomalies, and oversee all activities.
            </p>
          </div>
          <div className="browse-actions">
            <button
              onClick={fixUserRoles}
              disabled={fixingRoles}
              className="browse-btn browse-btn--ghost"
              style={{ fontSize: "12px", padding: "8px 12px" }}
              title="Fix user roles in database"
            >
              {fixingRoles ? "Fixing..." : "Fix Roles"}
            </button>
            {escrowedPayments.length > 0 && (
              <div className="browse-stat" style={{ 
                fontSize: "12px", 
                padding: "8px 12px",
                background: "rgba(251,191,36,.1)",
                border: "1px solid rgba(251,191,36,.3)",
                borderRadius: "8px",
              }}>
                <div style={{ fontSize: "11px", color: "var(--muted)" }}>Escrowed Payments</div>
                <div style={{ fontSize: "16px", fontWeight: 800 }}>{escrowedPayments.length}</div>
              </div>
            )}
            <button
              onClick={cleanupJobs}
              disabled={cleaning}
              className="browse-btn"
              style={{ 
                fontSize: "12px", 
                padding: "8px 12px",
                background: cleaning ? "rgba(239,68,68,.5)" : "rgba(239,68,68,.8)",
                border: "1px solid rgba(239,68,68,.5)",
              }}
              title="Cleanup invalid, disputed, and hanging jobs"
            >
              {cleaning ? "Cleaning..." : "Cleanup"}
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Platform Statistics</h2>
            <div className="browse-panel-subtitle">Key metrics at a glance</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {statCards.map((stat, index) => (
              <Link
                key={index}
                to={stat.link}
                className="browse-stat"
                style={{ 
                  minWidth: "auto",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderColor: stat.isAlert ? "rgba(239,68,68,.5)" : undefined,
                  background: stat.isAlert ? "rgba(239,68,68,.1)" : undefined,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = stat.isAlert ? "rgba(239,68,68,.5)" : "var(--border)";
                }}
              >
                <div className="browse-stat-label">{stat.label}</div>
                <div className="browse-stat-value">{stat.value}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Overview</h2>
            <div className="browse-panel-subtitle">System status and management</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
            {/* Anomalies Card */}
            <div className="job-card">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Anomaly Detection</h3>
                <Link to="/dashboard/admin/anomalies" className="browse-link" style={{ fontSize: "11px" }}>
                  View all →
                </Link>
              </div>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                Monitor system anomalies including missed deadlines, delayed payments, and user inactivity.
              </p>
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <div className="browse-stat-value" style={{ margin: "0", fontSize: "24px" }}>{stats.openAnomalies}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Open Issues</div>
                </div>
                <div>
                  <div className="browse-stat-value" style={{ margin: "0", fontSize: "24px" }}>{stats.totalAnomalies}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Total Detected</div>
                </div>
              </div>
            </div>

            {/* Tasks Overview */}
            <div className="job-card">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Tasks Overview</h3>
                <Link to="/dashboard/admin/tasks" className="browse-link" style={{ fontSize: "11px" }}>
                  View all →
                </Link>
              </div>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                Track all micro-internship tasks across the platform.
              </p>
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <div className="browse-stat-value" style={{ margin: "0", fontSize: "24px" }}>{stats.activeTasks}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Active</div>
                </div>
                <div>
                  <div className="browse-stat-value" style={{ margin: "0", fontSize: "24px" }}>{stats.completedTasks}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Completed</div>
                </div>
                <div>
                  <div className="browse-stat-value" style={{ margin: "0", fontSize: "24px" }}>{stats.totalTasks}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Total</div>
                </div>
              </div>
            </div>

            {/* Payments Overview */}
            <div className="job-card">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Payments</h3>
              </div>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                Monitor payment status and escrow transactions.
              </p>
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <div className="browse-stat-value" style={{ margin: "0", fontSize: "24px" }}>{stats.pendingPayments}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Pending</div>
                </div>
                <div>
                  <div className="browse-stat-value" style={{ margin: "0", fontSize: "24px" }}>{stats.totalPayments}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Total</div>
                </div>
              </div>
            </div>

            {/* User Management */}
            <div className="job-card">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>User Management</h3>
              </div>
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
                Manage students and employers on the platform.
              </p>
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <div className="browse-stat-value" style={{ margin: "0", fontSize: "24px" }}>{stats.totalStudents}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Students</div>
                </div>
                <div>
                  <div className="browse-stat-value" style={{ margin: "0", fontSize: "24px" }}>{stats.totalEmployers}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>Employers</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Escrowed Payments Section */}
        {escrowedPayments.length > 0 && (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div className="browse-panel-head">
              <h2 className="browse-panel-title">Escrowed Payments</h2>
              <div className="browse-panel-subtitle">
                {escrowedPayments.length} payment{escrowedPayments.length !== 1 ? "s" : ""} ready to release for completed jobs
              </div>
            </div>
            <div className="browse-cards" style={{ marginTop: "16px" }}>
              {escrowedPayments.map((payment: any) => {
                const task = payment.taskId;
                const student = payment.studentId;
                const employer = payment.employerId;
                const escrowedDate = payment.escrowedAt 
                  ? new Date(payment.escrowedAt).toLocaleDateString()
                  : "Unknown";

                return (
                  <article key={payment._id} className="job-card">
                    <div className="job-card-top">
                      <div className="job-card-main">
                        <div className="job-title">{task?.title || "Unknown Task"}</div>
                        <div className="job-sub">
                          {employer?.companyName || employer?.name || "Unknown Employer"} · Escrowed {escrowedDate}
                        </div>
                      </div>
                      <div className="job-badges">
                        <span className="badge badge--gold">{payment.amount} Gold</span>
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--muted)" }}>
                      <div><strong>Student:</strong> {student?.name || "Unknown"} ({student?.email || "N/A"})</div>
                      <div style={{ marginTop: "4px" }}><strong>Task Status:</strong> {task?.status || "Unknown"}</div>
                      {task?.completedAt && (
                        <div style={{ marginTop: "4px" }}>
                          <strong>Completed:</strong> {new Date(task.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="job-card-bottom">
                      <div className="job-meta">
                        <span className="meta-dot" />
                        Escrowed
                        <span className="meta-dot" />
                        {escrowedDate}
                      </div>
                      <button
                        onClick={() => releasePayment(payment._id)}
                        disabled={releasingPayment === payment._id}
                        className="browse-btn browse-btn--primary"
                        style={{ fontSize: "12px", padding: "8px 16px" }}
                      >
                        {releasingPayment === payment._id ? "Releasing..." : "Release Payment"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
