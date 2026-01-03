import { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";
import "./css/BrowsePage.css";

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
      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="12"
            height="12"
            viewBox="0 0 20 20"
            style={{ color: star <= rating ? "#fbbf24" : "rgba(255,255,255,.3)", fill: "currentColor" }}
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
        <span style={{ marginLeft: "4px", fontSize: "12px", fontWeight: "600", color: "var(--text)" }}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading leaderboard…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="browse-inner">
        {/* Header */}
        <header className="browse-header">
          <div className="browse-title-wrap">
            <div className="browse-eyebrow">Leaderboard</div>
            <h1 className="browse-title">Top performers ranked by achievements</h1>
            <p className="browse-subtitle">See how you compare with other students</p>
          </div>
        </header>

        {/* Sort Options */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Sort By</h2>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setSortBy("starRating")}
              className={`browse-chip ${sortBy === "starRating" ? "is-active" : ""}`}
            >
              Stars
            </button>
            <button
              onClick={() => setSortBy("totalTasksCompleted")}
              className={`browse-chip ${sortBy === "totalTasksCompleted" ? "is-active" : ""}`}
            >
              Jobs Completed
            </button>
            <button
              onClick={() => setSortBy("averageCompletionTime")}
              className={`browse-chip ${sortBy === "averageCompletionTime" ? "is-active" : ""}`}
            >
              Avg. Time
            </button>
          </div>
        </section>

        {/* Leaderboard Table */}
        <section className="browse-panel" style={{ marginTop: "16px", padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "rgba(255,255,255,.05)", borderBottom: "1px solid var(--border)" }}>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                    Rank
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                    Student
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                    Rating
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                    Jobs
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                    Avg. Time
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                    XP
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", fontSize: "13px", color: "var(--muted)" }}>
                      No students found.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr
                      key={entry._id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: entry.position <= 3 ? "rgba(251,191,36,.08)" : "transparent",
                        transition: "background 160ms ease",
                      }}
                      onMouseEnter={(e) => {
                        if (entry.position > 3) {
                          e.currentTarget.style.background = "rgba(255,255,255,.04)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (entry.position > 3) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <td style={{ padding: "16px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--text)" }}>
                          #{entry.position}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {entry.profilePicture ? (
                            <img
                              src={entry.profilePicture}
                              alt={entry.name}
                              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background: "rgba(124,58,237,.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "14px",
                              fontWeight: "700",
                            }}>
                              {entry.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)" }}>
                              {entry.name}
                            </div>
                            {entry.institution && (
                              <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                                {entry.institution}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        {renderStars(entry.starRating || 1)}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--text)" }}>
                          {entry.totalTasksCompleted || 0}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--text)" }}>
                          {entry.averageCompletionTime
                            ? `${entry.averageCompletionTime.toFixed(1)}d`
                            : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--text)" }}>
                          {entry.xp || 0}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
