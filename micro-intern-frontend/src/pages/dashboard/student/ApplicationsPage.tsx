import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";

type Application = {
  _id: string;
  status: "evaluating" | "accepted" | "rejected" | "applied";
  internshipId: {
    _id: string;
    title: string;
    companyName: string;
    status?: string;
  };
  createdAt: string;
};

type ApplicationsResponse = {
  success: boolean;
  data: Application[];
};

function getStatusBadge(status: string) {
  const badges = {
    accepted: { text: "Accepted", bg: "bg-[#d1fae5]", textColor: "text-[#065f46]", border: "border-[#a7f3d0]" },
    rejected: { text: "Rejected", bg: "bg-[#fee2e2]", textColor: "text-[#991b1b]", border: "border-[#fecaca]" },
    evaluating: { text: "Under Review", bg: "bg-[#fef3c7]", textColor: "text-[#92400e]", border: "border-[#fde68a]" },
    applied: { text: "Applied", bg: "bg-[#dbeafe]", textColor: "text-[#1e40af]", border: "border-[#bfdbfe]" },
  };
  return badges[status as keyof typeof badges] || badges.applied;
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<ApplicationsResponse>("/applications/me");
      if (res.success) {
        setApps(res.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading applications…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">My Applications</h1>
        <p className="text-sm text-[#6b7280]">Track the status of your job applications</p>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Applications List */}
      {apps.length === 0 ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-16 text-center">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">No Applications Yet</h3>
          <p className="text-sm text-[#6b7280] mb-6">
            You haven't applied to any jobs yet. Start browsing opportunities!
          </p>
          <Link to="/dashboard/student/browse" className="inline-block px-6 py-3 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {apps.map((app) => {
            const badge = getStatusBadge(app.status);
            return (
              <div key={app._id} className="border border-[#e5e7eb] rounded-lg bg-white p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-[#111827] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {app.internshipId.title.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-[#111827] mb-1 truncate">
                          {app.internshipId.title}
                        </h3>
                        <p className="text-sm text-[#6b7280]">{app.internshipId.companyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${badge.bg} ${badge.textColor} ${badge.border}`}>
                        {badge.text}
                      </span>
                      <span className="text-xs text-[#9ca3af]">
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      to={`/internships/${app.internshipId._id}`}
                      className="px-6 py-2.5 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors whitespace-nowrap"
                    >
                      View Job
                    </Link>
                    {app.status === "accepted" && app.internshipId.status === "completed" && (
                      <Link
                        to={`/dashboard/student/reviews/submit/${app.internshipId._id}`}
                        className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors whitespace-nowrap"
                      >
                        Review
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
