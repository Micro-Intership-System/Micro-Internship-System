import React, { useEffect, useState } from "react";
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
  tags?: string[];
  priorityLevel?: "high" | "medium" | "low";
  createdAt?: string;
  bannerUrl?: string;
  employerId?: string;
};

export default function BrowsePage() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [gold, setGold] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    loadInternships();
  }, []);

  async function loadInternships() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<{ success: boolean; data: Internship[] }>("/internships");
      // Filter out jobs without employerId (these cause "failed to apply" errors)
      const validJobs = (res.data || []).filter((job) => job.employerId);
      setInternships(validJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  const allSkills = Array.from(new Set(internships.flatMap((job) => job.skills || [])));

  // Helper functions for range filtering
  function getGoldRange(gold: number): string {
    if (gold < 500) return "<500";
    if (gold < 1000) return "500-1000";
    if (gold < 2000) return "1000-2000";
    if (gold < 5000) return "2000-5000";
    return "5000+";
  }

  function getDurationRange(duration: string): string {
    const lower = duration.toLowerCase();
    if (lower.includes("week") || lower.includes("1")) {
      const weeks = parseInt(lower.match(/\d+/)?.[0] || "0");
      if (weeks <= 1) return "1 week";
      if (weeks <= 2) return "2 weeks";
      if (weeks <= 4) return "3-4 weeks";
      return "1+ month";
    }
    if (lower.includes("month")) {
      const months = parseInt(lower.match(/\d+/)?.[0] || "0");
      if (months <= 1) return "1 month";
      if (months <= 3) return "2-3 months";
      return "3+ months";
    }
    return duration;
  }

  const filteredJobs = internships.filter((job) => {
    if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedSkills.length > 0) {
      const jobSkills = job.skills || [];
      if (!selectedSkills.some((skill) => jobSkills.includes(skill))) return false;
    }
    if (duration) {
      const jobDurationRange = getDurationRange(job.duration);
      if (jobDurationRange !== duration) return false;
    }
    if (gold) {
      const jobGoldRange = getGoldRange(job.gold);
      if (jobGoldRange !== gold) return false;
    }
    if (location && !job.location.toLowerCase().includes(location.toLowerCase())) return false;
    return true;
  });

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading jobs…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Browse Jobs</h1>
        <p className="text-sm text-[#6b7280]">Find your perfect micro-internship opportunity</p>
      </div>

      {/* Filter Card */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-6">Filter Jobs</h2>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for jobs, companies, or skills..."
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
            >
              <option value="">All Durations</option>
              <option value="1 week">1 Week</option>
              <option value="2 weeks">2 Weeks</option>
              <option value="3-4 weeks">3-4 Weeks</option>
              <option value="1 month">1 Month</option>
              <option value="2-3 months">2-3 Months</option>
              <option value="3+ months">3+ Months</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">Gold</label>
            <select
              value={gold}
              onChange={(e) => setGold(e.target.value)}
              className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
            >
              <option value="">All Gold Ranges</option>
              <option value="<500">&lt;500 Gold</option>
              <option value="500-1000">500-1,000 Gold</option>
              <option value="1000-2000">1,000-2,000 Gold</option>
              <option value="2000-5000">2,000-5,000 Gold</option>
              <option value="5000+">5,000+ Gold</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
            >
              <option value="">All Locations</option>
              <option value="remote">Remote</option>
              <option value="dhaka">Dhaka</option>
              <option value="chittagong">Chittagong</option>
            </select>
          </div>
        </div>

        {/* Skill Tags */}
        {allSkills.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs font-medium text-[#374151] mb-3 uppercase tracking-wide">Skill Tags</label>
            <div className="flex flex-wrap gap-3">
              {allSkills.slice(0, 8).map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedSkills.includes(skill)
                      ? "bg-[#111827] text-white"
                      : "bg-[#f9fafb] text-[#374151] border border-[#e5e7eb] hover:bg-[#f3f4f6]"
                  }`}
                >
                  {skill}
                </button>
              ))}
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

      {/* Job Listings */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#111827]">
            Available Jobs ({filteredJobs.length})
          </h2>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="border border-[#e5e7eb] rounded-lg bg-white p-12 text-center">
            <p className="text-sm text-[#6b7280]">No jobs found matching your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
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
                    <div className="text-sm font-semibold text-[#111827]">{getGoldRange(job.gold)} Gold</div>
                    <div className="text-sm text-[#6b7280]">{getDurationRange(job.duration)}</div>
                  </div>
                  <Link
                    to={`/internships/${job._id}`}
                    className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
