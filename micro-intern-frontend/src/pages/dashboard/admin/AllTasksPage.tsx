import { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../../../api/client";

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

  function getStatusColor(status: string) {
    const colors = {
      posted: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
      in_progress: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
      completed: "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]",
      cancelled: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
    };
    return colors[status as keyof typeof colors] || "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading tasks…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-[#111827] mb-3">All Tasks</h1>
        <p className="text-sm text-[#6b7280] max-w-2xl mx-auto">
          Monitor all micro-internship tasks across the platform. View status, assignments, and details.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
          className="flex-1 max-w-md px-4 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] bg-white"
        />
        <div className="flex items-center gap-3">
          <select
            value={filter.status || ""}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            className="px-3 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
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
            className="px-3 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#111827]"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">Gold</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#6b7280]">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-[#111827]">{task.title}</div>
                      <div className="text-xs text-[#6b7280]">{task.location} • {task.duration}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#111827]">{task.companyName}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-[#111827]">{task.gold.toLocaleString()} Gold</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-[#111827]">
                        {task.acceptedStudentId ? task.acceptedStudentId.name : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs text-[#6b7280]">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="px-3 py-1.5 rounded-lg bg-[#991b1b] text-white text-xs font-semibold hover:bg-[#7f1d1d] transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center text-sm text-[#6b7280]">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>
    </div>
  );
}


