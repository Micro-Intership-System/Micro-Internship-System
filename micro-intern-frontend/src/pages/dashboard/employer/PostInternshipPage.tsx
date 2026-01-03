import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, apiGet } from "../../../api/client";

const PostInternshipPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    workType: "remote" as "remote" | "on-site" | "hybrid",
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
  const [isRestricted, setIsRestricted] = useState(false);
  const [restrictionUntil, setRestrictionUntil] = useState<Date | null>(null);

  useEffect(() => {
    checkRestriction();
  }, []);

  async function checkRestriction() {
    try {
      const res = await apiGet<{ success: boolean; data: any }>("/employer/me");
      if (res.success && res.data) {
        const now = new Date();
        const restrictionDate = res.data.restrictionUntil 
          ? new Date(res.data.restrictionUntil) 
          : null;
        
        if (res.data.canOnlyPostLowPriority && restrictionDate && restrictionDate > now) {
          setIsRestricted(true);
          setRestrictionUntil(restrictionDate);
          setForm(prev => ({ ...prev, priorityLevel: "low" }));
        } else {
          setIsRestricted(false);
          setRestrictionUntil(null);
        }
      }
    } catch (err) {
      console.error("Failed to check restriction:", err);
    }
  }

  function update(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      
      // Format location based on work type
      let formattedLocation = "";
      if (form.workType === "remote") {
        formattedLocation = "Remote";
      } else if (form.workType === "on-site") {
        if (!form.location.trim()) {
          setError("Please enter a location for on-site work");
          setLoading(false);
          return;
        }
        formattedLocation = `On-site - ${form.location.trim()}`;
      } else if (form.workType === "hybrid") {
        if (!form.location.trim()) {
          setError("Please enter a location for hybrid work");
          setLoading(false);
          return;
        }
        formattedLocation = `Hybrid - ${form.location.trim()}`;
      }
      
      const payload = {
        ...form,
        location: formattedLocation,
        skills: form.skills.split(",").map(s => s.trim()).filter(s => s),
        tags: form.tags.split(",").map(t => t.trim()).filter(t => t),
        gold: Number(form.gold),
        deadline: form.deadline || undefined,
      };
      // Remove workType from payload as it's not in the schema
      delete (payload as any).workType;

      await apiPost("/internships", payload);
      navigate("/dashboard/employer/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post internship");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
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
                Work Type *
              </label>
              <select
                className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                value={form.workType}
                onChange={e => {
                  update("workType", e.target.value);
                  if (e.target.value === "remote") {
                    update("location", "");
                  }
                }}
                required
              >
                <option value="remote">Remote</option>
                <option value="on-site">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {(form.workType === "on-site" || form.workType === "hybrid") && (
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
                  Location * {(form.workType === "on-site" ? "(On-site)" : "(Hybrid)")}
                </label>
                <input
                  type="text"
                  placeholder={form.workType === "on-site" ? "e.g., Dhaka, Chittagong" : "e.g., Dhaka, Chittagong"}
                  className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
                  value={form.location}
                  onChange={e => update("location", e.target.value)}
                  required
                />
              </div>
            )}

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
              {isRestricted && (
                <div className="mb-2 p-2 bg-[#fef3c7] border border-[#fbbf24] rounded text-xs text-[#92400e]">
                  You are restricted to posting only low priority jobs until {restrictionUntil?.toLocaleDateString()}
                </div>
              )}
              <select
                className={`w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white ${
                  isRestricted ? "text-[#111827]" : "text-[#111827]"
                }`}
                value={form.priorityLevel}
                onChange={e => {
                  if (!isRestricted || e.target.value === "low") {
                    update("priorityLevel", e.target.value);
                  }
                }}
                style={isRestricted ? { cursor: "not-allowed" } : {}}
              >
                <option value="low">Low</option>
                <option 
                  value="medium" 
                  disabled={isRestricted}
                  style={{ 
                    color: isRestricted ? "#9ca3af" : "#111827",
                    backgroundColor: isRestricted ? "#f3f4f6" : "white",
                    opacity: isRestricted ? 0.5 : 1
                  }}
                >
                  Medium {isRestricted ? "(Restricted)" : ""}
                </option>
                <option 
                  value="high" 
                  disabled={isRestricted}
                  style={{ 
                    color: isRestricted ? "#9ca3af" : "#111827",
                    backgroundColor: isRestricted ? "#f3f4f6" : "white",
                    opacity: isRestricted ? 0.5 : 1
                  }}
                >
                  High {isRestricted ? "(Restricted)" : ""}
                </option>
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
