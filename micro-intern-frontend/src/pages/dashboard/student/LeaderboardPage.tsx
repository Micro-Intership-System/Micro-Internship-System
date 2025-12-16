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
      setEntries(res.data);
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
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? "text-yellow-400" : "text-slate-300"
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-sm font-medium text-slate-700">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-600">Loading leaderboard…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Leaderboard
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Top performers ranked by their achievements and performance metrics.
        </p>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy("starRating")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            sortBy === "starRating"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          ⭐ Stars
        </button>
        <button
          onClick={() => setSortBy("totalTasksCompleted")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            sortBy === "totalTasksCompleted"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          📋 Jobs Completed
        </button>
        <button
          onClick={() => setSortBy("averageCompletionTime")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            sortBy === "averageCompletionTime"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          ⏱️ Avg. Time
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  ⭐ Rating
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Jobs
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Avg. Time
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  XP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-600">
                    No students found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry._id}
                    className={`hover:bg-slate-50 transition-colors ${
                      entry.position <= 3 ? "bg-yellow-50/50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {entry.position === 1 && (
                          <span className="text-xl">🥇</span>
                        )}
                        {entry.position === 2 && (
                          <span className="text-xl">🥈</span>
                        )}
                        {entry.position === 3 && (
                          <span className="text-xl">🥉</span>
                        )}
                        <span className="text-sm font-semibold text-slate-900">
                          #{entry.position}
                        </span>
                      </div>
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
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {entry.name}
                          </div>
                          {entry.institution && (
                            <div className="text-xs text-slate-500">
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
                      <span className="text-sm font-semibold text-slate-900">
                        {entry.totalTasksCompleted || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-slate-900">
                        {entry.averageCompletionTime
                          ? `${entry.averageCompletionTime.toFixed(1)}d`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-slate-900">
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

