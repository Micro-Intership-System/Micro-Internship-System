import { useEffect, useState } from "react";
import "./css/EmployerJobsPage.css";
import { useParams, Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../../api/client";

type ApplicationStatus = "evaluating" | "accepted" | "rejected";

type Application = {
  _id: string;
  status: ApplicationStatus;
  studentId: {
    _id: string;
    name: string;
    email: string;
    institution?: string;
    skills?: string[];
    bio?: string;
    profilePicture?: string;
    starRating?: number;
    totalTasksCompleted?: number;
  };
  createdAt: string;
};

type Response = {
  success: boolean;
  data: Application[];
};

export default function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    apiGet<Response>(`/employer/jobs/${id}/applications`)
      .then(res => {
        if (res.success) setApps(res.data || []);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to load applications");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(
    appId: string,
    status: "accepted" | "rejected"
  ) {
    try {
      await apiPatch(`/employer/applications/${appId}/status`, { status });
      // Reload applications to get updated status
      const res = await apiGet<Response>(`/employer/jobs/${id}/applications`);
      if (res.success) setApps(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  function getStatusColor(status: ApplicationStatus) {
    const colors = {
      accepted: "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]",
      rejected: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
      evaluating: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
    };
    return colors[status];
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
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Job Applications</h1>
        <p className="text-sm text-[#6b7280]">Review and manage applications for this job posting</p>
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
          <p className="text-sm text-[#6b7280]">No applications yet for this job.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {apps.map((app) => (
            <div
              key={app._id}
              className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#111827] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {app.studentId.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[#111827] mb-1">
                        {app.studentId.name}
                      </h3>
                      <p className="text-sm text-[#6b7280]">{app.studentId.email}</p>
                      {app.studentId.institution && (
                        <p className="text-xs text-[#9ca3af] mt-1">{app.studentId.institution}</p>
                      )}
                    </div>
                  </div>

                  {app.studentId.bio && (
                    <p className="text-sm text-[#374151] mb-4 line-clamp-2">{app.studentId.bio}</p>
                  )}

                  {app.studentId.skills && app.studentId.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {app.studentId.skills.slice(0, 5).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-[#f9fafb] text-xs text-[#374151] border border-[#e5e7eb]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                    {app.studentId.starRating && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3 h-3 ${
                              star <= app.studentId.starRating! ? "text-yellow-400 fill-current" : "text-[#e5e7eb] fill-current"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-xs text-[#6b7280]">
                          {app.studentId.starRating.toFixed(1)} • {app.studentId.totalTasksCompleted || 0} tasks
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-[#9ca3af]">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {(app.status === "evaluating") && (
                    <>
                      <button
                        onClick={() => updateStatus(app._id, "accepted")}
                        className="px-4 py-2 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors whitespace-nowrap"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(app._id, "rejected")}
                        className="px-4 py-2 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors whitespace-nowrap"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {app.status === "accepted" && (
                    <>
                      <span className="px-4 py-2 rounded-lg bg-[#d1fae5] text-[#065f46] text-sm font-semibold border border-[#a7f3d0] whitespace-nowrap text-center">
                        Accepted
                      </span>
                      <Link
                        to={`/dashboard/employer/messages?taskId=${id}`}
                        className="px-4 py-2 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors whitespace-nowrap text-center"
                      >
                        Chat
                      </Link>
                    </>
                  )}
                  {app.status === "rejected" && (
                    <span className="px-4 py-2 rounded-lg bg-[#fee2e2] text-[#991b1b] text-sm font-semibold border border-[#fecaca] whitespace-nowrap text-center">
                      Rejected
                    </span>
                  )}
                  <Link
                    to={`/dashboard/employer/students/${app.studentId._id}`}
                    className="px-4 py-2 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors whitespace-nowrap text-center"
                  >
                    View Portfolio
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
