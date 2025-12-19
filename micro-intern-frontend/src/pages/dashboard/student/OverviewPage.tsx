import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiGet } from "../../../api/client";
import "./css/BrowsePage.css";

export default function OverviewPage() {
  const { user, refreshUser } = useAuth();
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    // Refresh user data when page loads to get latest gold
    refreshUser();
    
    // Load applications count
    apiGet<{ success: boolean; data: any[] }>("/applications/me")
      .then(res => {
        if (res.success) {
          setApplicationsCount(res.data?.length || 0);
        }
      })
      .catch(() => {});

    // Load review count
    if ((user as any)?._id) {
      apiGet<{ success: boolean; totalReviews: number }>(`/reviews/student/${(user as any)._id}`)
        .then(res => {
          if (res.success) {
            setReviewCount(res.totalReviews || 0);
          }
        })
        .catch(() => {});
    }

    // Refresh user data periodically (every 30 seconds)
    const interval = setInterval(() => {
      refreshUser();
      if ((user as any)?._id) {
        apiGet<{ success: boolean; totalReviews: number }>(`/reviews/student/${(user as any)._id}`)
          .then(res => {
            if (res.success) {
              setReviewCount(res.totalReviews || 0);
            }
          })
          .catch(() => {});
      }
    }, 30000);

    // Refresh when page gains focus
    const handleFocus = () => {
      refreshUser();
      if ((user as any)?._id) {
        apiGet<{ success: boolean; totalReviews: number }>(`/reviews/student/${(user as any)._id}`)
          .then(res => {
            if (res.success) {
              setReviewCount(res.totalReviews || 0);
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshUser, user]);

  const stats = [
    {
      label: "Applications",
      value: applicationsCount,
      detail: "Total applications",
      link: "/dashboard/student/applications",
    },
    {
      label: "Completed Tasks",
      value: (user as any)?.totalTasksCompleted || 0,
      detail: "Tasks finished",
    },
    {
      label: "Star Rating",
      value: (user as any)?.starRating || 1,
      detail: "Average rating",
    },
    {
      label: "Gold Earned",
      value: (user as any)?.gold || 0,
      detail: "Total gold",
    },
  ];

  function renderStars(rating: number, reviewCount?: number) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", gap: "2px", fontSize: "16px", alignItems: "center" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                color: star <= fullStars ? "#fbbf24" : star === fullStars + 1 && hasHalfStar ? "#fbbf24" : "rgba(255,255,255,0.3)",
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

  return (
    <div className="browse-page">
      <div className="browse-inner">
        {/* Header */}
        <header className="browse-header">
          <div className="browse-title-wrap">
            <div className="browse-eyebrow">Dashboard Overview</div>
            <h1 className="browse-title">Welcome back, {user?.name || "Student"}!</h1>
            <p className="browse-subtitle">
              Track your progress, applications, and achievements.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Gold</div>
              <div className="browse-stat-value">{(user as any)?.gold || 0}</div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Quick Stats</h2>
            <div className="browse-panel-subtitle">Your key metrics at a glance</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {stats.map((stat, index) => (
              <div key={index} className="browse-stat" style={{ minWidth: "auto" }}>
                <div className="browse-stat-label">{stat.label}</div>
                <div className="browse-stat-value">
                  {stat.label === "Star Rating" ? renderStars(stat.value, reviewCount) : stat.value}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>{stat.detail}</div>
                {stat.link && (
                  <Link
                    to={stat.link}
                    className="browse-link"
                    style={{ display: "block", marginTop: "8px", fontSize: "11px" }}
                  >
                    View all →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Resources Section */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Resources & Progress</h2>
            <div className="browse-panel-subtitle">Your learning journey</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            {/* Skills Card */}
            <div className="job-card">
              <div className="browse-stat-label">Skills</div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "12px" }}>Your skillset</div>
              <div className="browse-stat-value" style={{ margin: "0 0 12px 0" }}>
                {(user as any)?.skills?.length || 0}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "12px" }}>Skills acquired</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {((user as any)?.skills || []).slice(0, 3).map((skill: string, i: number) => (
                  <span key={i} className="skill-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Courses Card */}
            <div className="job-card">
              <div className="browse-stat-label">Courses</div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "12px" }}>Completed courses</div>
              <div className="browse-stat-value" style={{ margin: "0 0 12px 0" }}>
                {(user as any)?.completedCourses?.length || 0}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "12px" }}>Courses finished</div>
              <Link
                to="/dashboard/student/courses"
                className="browse-link"
                style={{ fontSize: "11px" }}
              >
                View courses →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
