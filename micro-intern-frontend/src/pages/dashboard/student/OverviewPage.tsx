import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiGet } from "../../../api/client";
import "./css/BrowsePage.css";

export default function OverviewPage() {
  const { user, refreshUser } = useAuth();
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState(0);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [currentGold, setCurrentGold] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  // Refresh data when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadAllData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      // Refresh user data first
      await refreshUser();
      
      // Load all stats in parallel
      await Promise.all([
        loadApplicationsCount(),
        loadCertificatesCount(),
        loadCoursesData(),
        loadGold(),
      ]);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadApplicationsCount() {
    try {
      const res = await apiGet<{ success: boolean; data: any[] }>("/applications/me");
      if (res.success) {
        setTotalApplications(res.data?.length || 0);
      }
    } catch (err) {
      console.error("Failed to load applications count:", err);
    }
  }

  async function loadCertificatesCount() {
    try {
      const res = await apiGet<{ success: boolean; data: any[] }>("/shop/my-courses");
      if (res.success) {
        const completed = res.data.filter((enrollment: any) => enrollment.completedAt);
        setTotalCertificates(completed.length);
      }
    } catch (err) {
      console.error("Failed to load certificates count:", err);
    }
  }

  async function loadCoursesData() {
    try {
      const res = await apiGet<{ success: boolean; data: any[] }>("/shop/my-courses");
      if (res.success) {
        const enrollments = res.data || [];
        setEnrolledCourses(enrollments.length);
        const completed = enrollments.filter((e: any) => e.completedAt);
        setCompletedCourses(completed.length);
      }
    } catch (err) {
      console.error("Failed to load courses data:", err);
    }
  }

  async function loadGold() {
    try {
      // Refresh user to get latest gold
      await refreshUser();
      setCurrentGold((user as any)?.gold || 0);
    } catch (err) {
      console.error("Failed to load gold:", err);
    }
  }

  // Update gold when user data changes
  useEffect(() => {
    if (user) {
      setCurrentGold((user as any)?.gold || 0);
    }
  }, [user]);

  const stats = [
    {
      label: "Applications",
      value: totalApplications,
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
      value: currentGold,
      detail: "Total gold",
    },
  ];

  return (
    <div className="browse-page">
      <div className="browse-inner">
        {/* Header */}
        <header className="browse-header">
          <div className="browse-title-wrap">
            <div className="browse-eyebrow">Dashboard Overview</div>
            <h1 className="browse-title">Welcome back, {user?.name || "Student"}!</h1>
            <p className="browse-subtitle">Track your progress and manage your micro-internships</p>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Statistics</h2>
            <div className="browse-panel-subtitle">Your activity overview</div>
          </div>
          <div className="browse-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {stats.map((stat, index) => (
              <article key={index} className="job-card">
                <div>
                  <div className="browse-stat-label" style={{ marginBottom: "8px" }}>{stat.label}</div>
                  <div className="browse-stat-value" style={{ fontSize: "32px", marginBottom: "4px" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    {stat.detail}
                  </div>
                  {stat.link && (
                    <Link
                      to={stat.link}
                      className="browse-link"
                      style={{ display: "block", marginTop: "12px", fontSize: "12px" }}
                    >
                      View all →
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Resources Section */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Resources</h2>
            <div className="browse-panel-subtitle">Quick access to key features</div>
          </div>
          <div className="browse-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
            {/* Courses Card */}
            <article className="job-card">
              <div>
                <div className="browse-stat-label" style={{ marginBottom: "8px" }}>Courses</div>
                <div className="browse-stat-value" style={{ fontSize: "32px", marginBottom: "4px" }}>
                  {loading ? "..." : completedCourses}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>
                  {enrolledCourses} enrolled, {completedCourses} completed
                </div>
                <Link
                  to="/dashboard/student/courses"
                  className="browse-btn browse-btn--ghost"
                  style={{ width: "100%", marginTop: "8px" }}
                >
                  View courses →
                </Link>
              </div>
            </article>

            {/* Certificates Card */}
            <article className="job-card">
              <div>
                <div className="browse-stat-label" style={{ marginBottom: "8px" }}>Certificates</div>
                <div className="browse-stat-value" style={{ fontSize: "32px", marginBottom: "4px" }}>
                  {loading ? "..." : totalCertificates}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>
                  Certificates earned
                </div>
                <Link
                  to="/dashboard/student/certificates"
                  className="browse-btn browse-btn--ghost"
                  style={{ width: "100%", marginTop: "8px" }}
                >
                  View certificates →
                </Link>
              </div>
            </article>

            {/* Portfolio Card */}
            <article className="job-card">
              <div>
                <div className="browse-stat-label" style={{ marginBottom: "8px" }}>Portfolio</div>
                <div style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "12px" }}>
                  Showcase your achievements
                </div>
                <Link
                  to="/dashboard/student/portfolio"
                  className="browse-btn browse-btn--ghost"
                  style={{ width: "100%", marginTop: "8px" }}
                >
                  View portfolio →
                </Link>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
