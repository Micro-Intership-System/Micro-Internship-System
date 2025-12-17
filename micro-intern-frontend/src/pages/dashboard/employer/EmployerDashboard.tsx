import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function EmployerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Employer Dashboard</h1>
        <p className="text-sm text-[#6b7280]">Welcome back, {user?.name || "Employer"}! Manage your micro-internship postings and applications.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to="/dashboard/employer/post"
          className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="w-16 h-16 rounded-lg bg-[#111827] mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
            +
          </div>
          <div className="text-sm font-semibold text-[#111827] mb-1">Post New Job</div>
          <div className="text-xs text-[#6b7280]">Create a new micro-internship opportunity</div>
        </Link>

        <Link
          to="/dashboard/employer/jobs"
          className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="w-16 h-16 rounded-lg bg-[#111827] mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
            📋
          </div>
          <div className="text-sm font-semibold text-[#111827] mb-1">My Jobs</div>
          <div className="text-xs text-[#6b7280]">View and manage your posted jobs</div>
        </Link>

        <Link
          to="/dashboard/employer/profile"
          className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="w-16 h-16 rounded-lg bg-[#111827] mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
            ⚙️
          </div>
          <div className="text-sm font-semibold text-[#111827] mb-1">Company Profile</div>
          <div className="text-xs text-[#6b7280]">Update your company information</div>
        </Link>
      </div>

      {/* Info Card */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Getting Started</h2>
        <p className="text-sm text-[#6b7280] mb-4">
          Post micro-internship opportunities to connect with talented students. Manage applications, communicate with candidates, and release payments through our secure escrow system.
        </p>
        <ul className="text-sm text-[#374151] space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-[#111827] font-semibold">•</span>
            <span>Post detailed job descriptions with required skills and gold rewards</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#111827] font-semibold">•</span>
            <span>Review student applications and portfolios</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#111827] font-semibold">•</span>
            <span>Chat with accepted students during task execution</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#111827] font-semibold">•</span>
            <span>Release payments securely through escrow after completion</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
