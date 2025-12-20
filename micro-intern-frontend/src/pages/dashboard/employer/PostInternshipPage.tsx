import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../../api/client";
import "./css/PostInternshipPage.css";

const PostInternshipPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    location: "",
    duration: "",
    gold: "",
    skills: "",
    tags: "",
    bannerUrl: "",
    description: "",
    deadline: "",
    priorityLevel: "medium" as "high" | "medium" | "low",
    isFeatured: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const payload = {
        ...form,
        skills: form.skills.split(",").map(s => s.trim()).filter(s => s),
        tags: form.tags.split(",").map(t => t.trim()).filter(t => t),
        gold: Number(form.gold),
        deadline: form.deadline || undefined,
      };

      await apiPost("/internships", payload);
      navigate("/dashboard/employer/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post internship");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="postJob space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Post a New Internship</h1>
        <p className="text-sm text-[#6b7280]">Create a new micro-internship opportunity for students</p>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={submit} className="space-y-6">
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">Job Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Job Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Frontend Developer Intern"
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                value={form.title}
                onChange={e => update("title", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Location *
              </label>
              <input
                type="text"
                placeholder="e.g., Remote, Dhaka"
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                value={form.location}
                onChange={e => update("location", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Duration *
              </label>
              <input
                type="text"
                placeholder="e.g., 2 weeks, 1 month"
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                value={form.duration}
                onChange={e => update("duration", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Gold Reward *
              </label>
              <input
                type="number"
                placeholder="e.g., 5000"
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                value={form.gold}
                onChange={e => update("gold", e.target.value)}
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Priority Level
              </label>
              <select
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                value={form.priorityLevel}
                onChange={e => update("priorityLevel", e.target.value)}
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
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                value={form.deadline}
                onChange={e => update("deadline", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Skills (comma separated) *
              </label>
              <input
                type="text"
                placeholder="e.g., React, JavaScript, UI/UX"
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                value={form.skills}
                onChange={e => update("skills", e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g., remote, part-time, beginner-friendly"
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                value={form.tags}
                onChange={e => update("tags", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Banner URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/banner.jpg"
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                value={form.bannerUrl}
                onChange={e => update("bannerUrl", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                Description *
              </label>
              <textarea
                rows={6}
                placeholder="Describe the micro-internship opportunity, requirements, and what students will learn..."
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white resize-none"
                value={form.description}
                onChange={e => update("description", e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 border border-[#d1d5db] rounded text-[#111827] focus:ring-2 focus:ring-[#111827]"
                  checked={form.isFeatured}
                  onChange={e => update("isFeatured", e.target.checked)}
                />
                <span className="text-sm text-[#374151]">Feature this job on the homepage</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
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
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Posting..." : "Post Internship"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostInternshipPage;
