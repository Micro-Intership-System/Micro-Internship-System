import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../../api/client";
import { Link } from "react-router-dom";

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

  useEffect(() => {
    loadStats();
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
          ...res.issues.slice(0, 10), // Show first 10 issues
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

  async function loadStats() {
    try {
      setLoading(true);
      // Load all stats from various endpoints
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
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading dashboard…</div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Students",
      value: stats.totalStudents,
      link: "/dashboard/admin/students",
      color: "bg-[#111827]",
    },
    {
      label: "Total Employers",
      value: stats.totalEmployers,
      link: "/dashboard/admin/employers",
      color: "bg-[#111827]",
    },
    {
      label: "Active Tasks",
      value: stats.activeTasks,
      link: "/dashboard/admin/tasks",
      color: "bg-[#111827]",
    },
    {
      label: "Open Anomalies",
      value: stats.openAnomalies,
      link: "/dashboard/admin/anomalies",
      color: stats.openAnomalies > 0 ? "bg-[#991b1b]" : "bg-[#111827]",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-2">Admin Dashboard</h1>
          <p className="text-sm text-[#6b7280]">
            Monitor and manage the entire Micro-Internship platform. View statistics, resolve anomalies, and oversee all activities.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fixUserRoles}
            disabled={fixingRoles}
            className="px-4 py-2 rounded-lg bg-[#065f46] text-white text-sm font-semibold hover:bg-[#047857] transition-colors disabled:opacity-50 whitespace-nowrap"
            title="Fix user roles in database"
          >
            {fixingRoles ? "Fixing..." : "Fix User Roles"}
          </button>
          <button
            onClick={cleanupJobs}
            disabled={cleaning}
            className="px-4 py-2 rounded-lg bg-[#991b1b] text-white text-sm font-semibold hover:bg-[#7f1d1d] transition-colors disabled:opacity-50 whitespace-nowrap"
            title="Cleanup invalid, disputed, and hanging jobs. Returns coins to users appropriately."
          >
            {cleaning ? "Cleaning..." : "Cleanup Jobs"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow text-center"
          >
            <div className={`w-16 h-16 ${stat.color} rounded-lg mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold`}>
              {stat.value}
            </div>
            <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomalies Card */}
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">Anomaly Detection</h2>
            <Link
              to="/dashboard/admin/anomalies"
              className="text-xs text-[#111827] hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          <p className="text-sm text-[#6b7280] mb-4">
            Monitor system anomalies including missed deadlines, delayed payments, and user inactivity.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#111827]">{stats.openAnomalies}</div>
              <div className="text-xs text-[#6b7280]">Open Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#111827]">{stats.totalAnomalies}</div>
              <div className="text-xs text-[#6b7280]">Total Detected</div>
            </div>
          </div>
        </div>

        {/* Tasks Overview */}
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">Tasks Overview</h2>
            <Link
              to="/dashboard/admin/tasks"
              className="text-xs text-[#111827] hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          <p className="text-sm text-[#6b7280] mb-4">
            Track all micro-internship tasks across the platform.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#111827]">{stats.activeTasks}</div>
              <div className="text-xs text-[#6b7280]">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#111827]">{stats.completedTasks}</div>
              <div className="text-xs text-[#6b7280]">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#111827]">{stats.totalTasks}</div>
              <div className="text-xs text-[#6b7280]">Total</div>
            </div>
          </div>
        </div>

        {/* Payments Overview */}
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">Payments</h2>
          </div>
          <p className="text-sm text-[#6b7280] mb-4">
            Monitor payment status and escrow transactions.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#111827]">{stats.pendingPayments}</div>
              <div className="text-xs text-[#6b7280]">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#111827]">{stats.totalPayments}</div>
              <div className="text-xs text-[#6b7280]">Total</div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#111827]">User Management</h2>
          </div>
          <p className="text-sm text-[#6b7280] mb-4">
            Manage students and employers on the platform.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#111827]">{stats.totalStudents}</div>
              <div className="text-xs text-[#6b7280]">Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#111827]">{stats.totalEmployers}</div>
              <div className="text-xs text-[#6b7280]">Employers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


