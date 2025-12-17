import { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";

type LeaderboardEntry = {
  position: number;
  _id: string;
  name: string;
  email: string;
  starRating: number;
  totalTasksCompleted: number;
  averageCompletionTime: number;
  xp: number;
  gold: number;
  profilePicture?: string;
  institution?: string;
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"starRating" | "totalTasksCompleted" | "averageCompletionTime">("starRating");

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  async function loadLeaderboard() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: LeaderboardEntry[] }>(
        `/leaderboard?sortBy=${sortBy === "starRating" ? "stars" : sortBy === "totalTasksCompleted" ? "jobs" : "time"}`
      );
      setEntries(res.data || []);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3 h-3 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-[#e5e7eb] fill-current"
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
        <span className="ml-1 text-sm font-medium text-[#374151]">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading leaderboard…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Leaderboard</h1>
        <p className="text-sm text-[#6b7280]">
          Top performers ranked by their achievements and performance metrics.
        </p>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy("starRating")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            sortBy === "starRating"
              ? "bg-[#111827] text-white"
              : "bg-[#f9fafb] text-[#374151] border border-[#e5e7eb] hover:bg-[#f3f4f6]"
          }`}
        >
          Stars
        </button>
        <button
          onClick={() => setSortBy("totalTasksCompleted")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            sortBy === "totalTasksCompleted"
              ? "bg-[#111827] text-white"
              : "bg-[#f9fafb] text-[#374151] border border-[#e5e7eb] hover:bg-[#f3f4f6]"
          }`}
        >
          Jobs Completed
        </button>
        <button
          onClick={() => setSortBy("averageCompletionTime")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            sortBy === "averageCompletionTime"
              ? "bg-[#111827] text-white"
              : "bg-[#f9fafb] text-[#374151] border border-[#e5e7eb] hover:bg-[#f3f4f6]"
          }`}
        >
          Avg. Time
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Jobs
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  Avg. Time
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">
                  XP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6b7280]">
                    No students found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry._id}
                    className={`hover:bg-[#f9fafb] transition-colors ${
                      entry.position <= 3 ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[#111827]">
                        #{entry.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {entry.profilePicture ? (
                          <img
                            src={entry.profilePicture}
                            alt={entry.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center text-white font-semibold text-sm">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-[#111827]">
                            {entry.name}
                          </div>
                          {entry.institution && (
                            <div className="text-xs text-[#6b7280]">
                              {entry.institution}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderStars(entry.starRating || 1)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-[#111827]">
                        {entry.totalTasksCompleted || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-[#111827]">
                        {entry.averageCompletionTime
                          ? `${entry.averageCompletionTime.toFixed(1)}d`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-[#111827]">
                        {entry.xp || 0}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
