import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost } from "../api/client";

type Internship = {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  duration: string;
  gold: number;
  skills?: string[];
  description?: string;
  updatedAt?: string;
};

type InternshipResponse = {
  success: boolean;
  data: Internship;
};

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function InternshipDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    apiGet<InternshipResponse>(`/internships/${id}`)
      .then(res => {
        if (res.success) setJob(res.data);
      })
      .catch(() => setError("Failed to load job details"))
      .finally(() => setLoading(false));
  }, [id]);

  async function apply() {
    if (!job) return;

    try {
      setApplying(true);
      setError("");

      await apiPost("/applications", {
        internshipId: job._id,
      });

      setApplied(true);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to apply.");
      }
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading job details…</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#991b1b]">Job not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
        <h1 className="text-3xl font-semibold text-[#111827] mb-2">
          {job.title}
        </h1>
        <p className="text-sm text-[#6b7280]">
          {job.companyName} · Updated {timeAgo(job.updatedAt)}
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
            <h2 className="text-xl font-semibold text-[#111827] mb-4">Description</h2>
            <p className="text-sm text-[#374151] whitespace-pre-line leading-relaxed">
              {job.description || "No description provided."}
            </p>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
              <h2 className="text-xl font-semibold text-[#111827] mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-[#f9fafb] text-xs text-[#374151] border border-[#e5e7eb]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Details & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Job Details</h2>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1">Location</div>
                <div className="text-[#111827] font-medium">{job.location}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1">Duration</div>
                <div className="text-[#111827] font-medium">{job.duration}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-1">Gold Reward</div>
                <div className="text-[#111827] font-medium text-lg">{job.gold.toLocaleString()} Gold</div>
              </div>
            </div>
          </div>

          <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Apply Now</h2>
            {error && (
              <div className="mb-4 border border-[#fecaca] bg-[#fee2e2] rounded-lg px-3 py-2 text-xs text-[#991b1b]">
                {error}
              </div>
            )}
            <button
              onClick={apply}
              disabled={applied || applying}
              className="w-full rounded-lg bg-[#111827] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1f2937] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applied ? "Applied ✓" : applying ? "Applying…" : "Apply Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
