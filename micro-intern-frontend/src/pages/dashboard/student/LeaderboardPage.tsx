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
  gold: number;
  totalReviews?: number;
  profilePicture?: string;
  institution?: string;
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"stars" | "jobs" | "gold" | "time">("stars");

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  async function loadLeaderboard() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: LeaderboardEntry[] }>(
        `/leaderboard?sortBy=${sortBy}`
      );
      setEntries(res.data || []);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }

  function renderStars(rating: number, reviewCount?: number) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                fontSize: "14px",
                color: star <= rating ? "#fbbf24" : "rgba(255,255,255,0.3)",
              }}
            >
              ★
            </span>
          ))}
          <span style={{ marginLeft: "4px", fontSize: "12px", color: "var(--muted)" }}>
            {rating.toFixed(1)}
          </span>
        </div>
        {reviewCount !== undefined && reviewCount > 0 && (
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
            ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
          </span>
        )}
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
            <div className="browse-eyebrow">Student Rankings</div>
            <h1 className="browse-title">Leaderboard</h1>
            <p className="browse-subtitle">
              Top performers ranked by their achievements and performance metrics.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Students</div>
              <div className="browse-stat-value">{entries.length}</div>
            </div>
          </div>
        </header>

        {/* Sort Options */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Sort By</h2>
            <div className="browse-panel-subtitle">Choose ranking criteria</div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() => setSortBy("stars")}
              className={`browse-btn ${sortBy === "stars" ? "browse-btn--primary" : "browse-btn--ghost"}`}
              style={{ fontSize: "12px", padding: "8px 16px" }}
            >
              Stars
            </button>
            <button
              onClick={() => setSortBy("jobs")}
              className={`browse-btn ${sortBy === "jobs" ? "browse-btn--primary" : "browse-btn--ghost"}`}
              style={{ fontSize: "12px", padding: "8px 16px" }}
            >
              Jobs Completed
            </button>
            <button
              onClick={() => setSortBy("gold")}
              className={`browse-btn ${sortBy === "gold" ? "browse-btn--primary" : "browse-btn--ghost"}`}
              style={{ fontSize: "12px", padding: "8px 16px" }}
            >
              Highest Earner
            </button>
            <button
              onClick={() => setSortBy("time")}
              className={`browse-btn ${sortBy === "time" ? "browse-btn--primary" : "browse-btn--ghost"}`}
              style={{ fontSize: "12px", padding: "8px 16px" }}
            >
              Avg. Time
            </button>
          </div>
        </section>

        {/* Leaderboard Table */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Rankings</h2>
            <div className="browse-panel-subtitle">Top {entries.length} students</div>
          </div>
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
              No students found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>
                      Rank
                    </th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>
                      Student
                    </th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>
                      Rating
                    </th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>
                      Jobs
                    </th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>
                      Gold
                    </th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>
                      Avg. Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry._id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "16px", fontWeight: 800 }}>
                        #{entry.position}
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
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "14px" }}>
                              {entry.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "14px" }}>
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
                        {renderStars(entry.starRating || 1, entry.totalReviews)}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontWeight: 800 }}>
                        {entry.totalTasksCompleted || 0}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontWeight: 800 }}>
                        {entry.gold?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontWeight: 800 }}>
                        {entry.averageCompletionTime
                          ? `${entry.averageCompletionTime.toFixed(1)}d`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
