import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPut } from "../../../api/client";

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    location: "",
    duration: "",
    budget: "",
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
      
      setForm({
        title: job.title || "",
        location: job.location || "",
        duration: job.duration || "",
        budget: job.budget?.toString() || "",
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
        budget: Number(form.budget),
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
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-600">Loading job details…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Edit Job Posting
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Update the details of your internship posting.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g., Remote, Dhaka, Bangladesh"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Duration *
            </label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g., 2 weeks, 1 month"
              required
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Budget (BDT) *
            </label>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => update("budget", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              min="0"
              required
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Deadline
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Priority Level
            </label>
            <select
              value={form.priorityLevel}
              onChange={(e) => update("priorityLevel", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => update("skills", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g., React, Node.js, MongoDB"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g., remote, frontend, part-time"
            />
          </div>

          {/* Banner URL */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Banner Image URL
            </label>
            <input
              type="url"
              value={form.bannerUrl}
              onChange={(e) => update("bannerUrl", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          {/* Featured */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={form.isFeatured}
              onChange={(e) => update("isFeatured", e.target.checked)}
              className="rounded border-slate-300"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-slate-900">
              Feature this job
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard/employer/jobs")}
            className="rounded-xl border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

