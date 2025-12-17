import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPut } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobData, setJobData] = useState<any>(null);
  const [form, setForm] = useState({
    title: "",
    location: "",
    duration: "",
    gold: "",
    description: "",
    skills: "",
    tags: "",
    bannerUrl: "",
    priorityLevel: "medium" as "high" | "medium" | "low",
    isFeatured: false,
    deadline: "",
  });

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  async function loadJob() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<{ success: boolean; data: any }>(`/internships/${id}`);
      const job = res.data;
      setJobData(job);
      
      setForm({
        title: job.title || "",
        location: job.location || "",
        duration: job.duration || "",
        gold: job.gold?.toString() || "",
        description: job.description || "",
        skills: job.skills?.join(", ") || "",
        tags: job.tags?.join(", ") || "",
        bannerUrl: job.bannerUrl || "",
        priorityLevel: job.priorityLevel || "medium",
        isFeatured: job.isFeatured || false,
        deadline: job.deadline ? new Date(job.deadline).toISOString().split("T")[0] : "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  }

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError("");
      const payload = {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        gold: Number(form.gold),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      };

      await apiPut(`/internships/${id}`, payload);
      navigate("/dashboard/employer/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update job");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading job details…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Edit Job Posting</h1>
        <p className="text-sm text-[#6b7280]">Update the details of your internship posting</p>
        {jobData && (
          <div className="mt-4 p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
            <div className="text-sm text-[#374151] space-y-1">
              <div><span className="font-medium">Company:</span> {jobData.companyName}</div>
              <div><span className="font-medium">Posted by:</span> {user?.name || "Employer"}</div>
              {jobData.updatedAt && (
                <div><span className="font-medium">Last updated:</span> {new Date(jobData.updatedAt).toLocaleString()}</div>
              )}
              {jobData.acceptedStudentId && (
                <div className="mt-2 p-2 bg-[#fef3c7] border border-[#fde68a] rounded text-xs text-[#92400e]">
                  ⚠️ A student has been accepted for this job. Any changes will be notified to the student and admin.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">Job Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Job Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Location *
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                placeholder="e.g., Remote, Dhaka"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Duration *
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                placeholder="e.g., 2 weeks, 1 month"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Gold Reward *
              </label>
              <input
                type="number"
                value={form.gold}
                onChange={(e) => update("gold", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Priority Level
              </label>
              <select
                value={form.priorityLevel}
                onChange={(e) => update("priorityLevel", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => update("deadline", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={6}
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white resize-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={form.skills}
                onChange={(e) => update("skills", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                placeholder="e.g., React, Node.js, MongoDB"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                placeholder="e.g., remote, frontend, part-time"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Banner Image URL
              </label>
              <input
                type="url"
                value={form.bannerUrl}
                onChange={(e) => update("bannerUrl", e.target.value)}
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                placeholder="https://example.com/banner.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => update("isFeatured", e.target.checked)}
                  className="w-4 h-4 border border-[#d1d5db] rounded text-[#111827] focus:ring-2 focus:ring-[#111827]"
                />
                <span className="text-sm text-[#374151]">Feature this job on the homepage</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/employer/jobs")}
            className="px-6 py-2.5 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
