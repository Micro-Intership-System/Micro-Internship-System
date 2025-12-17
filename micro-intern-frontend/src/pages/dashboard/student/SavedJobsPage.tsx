import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";

type Internship = {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  duration: string;
  gold: number;
  skills?: string[];
  createdAt?: string;
};

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSavedJobs();
  }, []);

  async function loadSavedJobs() {
    try {
      setLoading(true);
      setError("");
      // TODO: Replace with actual saved jobs endpoint
      const res = await apiGet<{ success: boolean; data: Internship[] }>("/internships");
      if (res.success) {
        setJobs(res.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading saved jobs…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Saved Jobs</h1>
        <p className="text-sm text-[#6b7280]">Your bookmarked micro-internship opportunities</p>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-16 text-center">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">No Saved Jobs</h3>
          <p className="text-sm text-[#6b7280] mb-6">
            You haven't saved any jobs yet. Start browsing and save opportunities you're interested in!
          </p>
          <Link to="/dashboard/student/browse" className="inline-block px-6 py-3 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job._id} className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[#111827] mb-1 truncate">{job.title}</h3>
                  <p className="text-sm text-[#6b7280] mb-2">{job.companyName} • {job.location}</p>
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.skills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-[#f9fafb] text-xs text-[#374151] border border-[#e5e7eb]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#e5e7eb] gap-4">
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-lg font-bold text-[#111827]">{job.gold.toLocaleString()} Gold</div>
                  <div className="text-sm text-[#6b7280]">{job.duration}</div>
                </div>
                <Link
                  to={`/internships/${job._id}`}
                  className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors whitespace-nowrap flex-shrink-0"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
