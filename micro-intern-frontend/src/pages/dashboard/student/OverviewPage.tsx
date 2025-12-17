import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function OverviewPage() {
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    // Refresh user data when page loads to get latest gold/xp
    refreshUser();
  }, []);

  const stats = [
    {
      label: "Applications",
      value: 0,
      color: "bg-[#111827]",
      detail: "Total applications",
      link: "/dashboard/student/applications",
    },
    {
      label: "Completed Tasks",
      value: (user as any)?.totalTasksCompleted || 0,
      color: "bg-[#111827]",
      detail: "Tasks finished",
    },
    {
      label: "Star Rating",
      value: (user as any)?.starRating || 1,
      color: "bg-[#111827]",
      detail: "Average rating",
    },
    {
      label: "Gold Earned",
      value: (user as any)?.gold || 0,
      color: "bg-[#111827]",
      detail: "Total gold",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Dashboard Overview</h1>
        <p className="text-sm text-[#6b7280]">Welcome back, {user?.name || "Student"}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              {stat.link && (
                <Link to={stat.link} className="text-xs text-[#111827] hover:underline font-medium whitespace-nowrap">
                  View all →
                </Link>
              )}
            </div>
            <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1">{stat.label}</div>
            <div className="text-3xl font-bold text-[#111827] mb-1">{stat.value}</div>
            <div className="text-xs text-[#9ca3af]">{stat.detail}</div>
          </div>
        ))}
      </div>

      {/* Resources Section */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-[#111827] mb-6">Resources</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* XP Card */}
          <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
            <div className="mb-4">
              <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1">XP</div>
              <div className="text-xs text-[#9ca3af]">Experience Points</div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-3xl font-bold text-[#111827] mb-1">{(user as any)?.xp || 0}</div>
                <div className="text-xs text-[#9ca3af]">Total XP earned</div>
              </div>
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="transform -rotate-90 w-20 h-20">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="#111827"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.6)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-sm font-bold text-[#111827]">60%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Card */}
          <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
            <div className="mb-4">
              <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1">Skills</div>
              <div className="text-xs text-[#9ca3af]">Your skillset</div>
            </div>
            <div className="mb-4">
              <div className="text-3xl font-bold text-[#111827] mb-1">{(user as any)?.skills?.length || 0}</div>
              <div className="text-xs text-[#9ca3af]">Skills acquired</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {((user as any)?.skills || []).slice(0, 3).map((skill: string, i: number) => (
                <span key={i} className="px-2.5 py-1 rounded bg-[#f9fafb] text-xs text-[#374151] border border-[#e5e7eb]">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Courses Card */}
          <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
            <div className="mb-4">
              <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1">Courses</div>
              <div className="text-xs text-[#9ca3af]">Completed courses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#111827] mb-1">{(user as any)?.completedCourses?.length || 0}</div>
              <div className="text-xs text-[#9ca3af] mb-4">Courses finished</div>
              <Link
                to="/dashboard/student/courses"
                className="text-xs text-[#111827] hover:underline font-medium"
              >
                View courses →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
