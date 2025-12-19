import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./css/StudentLayout.css";

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const nav = [
    { label: "Home", to: "/dashboard/student" },
    { label: "Browse Jobs", to: "/dashboard/student/browse" },
    { label: "Applications", to: "/dashboard/student/applications" },
    { label: "Running Jobs", to: "/dashboard/student/running-jobs" },
    { label: "Messages", to: "/dashboard/student/messages" },
    { label: "Courses", to: "/dashboard/student/courses" },
    { label: "Payments", to: "/dashboard/student/payments" },
    { label: "Reviews", to: "/dashboard/student/reviews" },
    { label: "Certificates", to: "/dashboard/student/certificates" },
    { label: "Leaderboard", to: "/dashboard/student/leaderboard" },
    { label: "Portfolio", to: "/dashboard/student/portfolio" },
    { label: "Notifications", to: "/dashboard/student/notifications" },
  ];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="student-shell">
      <div className="student-grid">
        {/* Sidebar */}
        <aside className="student-sidebar">
          <div className="student-brand">
            <div className="student-logo" />
            <div>
              <div className="student-brand-title">Micro-Internship</div>
              <div className="student-brand-sub">Student Dashboard</div>
            </div>
          </div>

          <nav className="student-nav">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `student-link ${isActive ? "active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="student-profile">
            <div className="student-profile-name">
              {user?.name ?? "Student"}
            </div>
            <div className="student-profile-email">
              {user?.email ?? ""}
            </div>

            <button className="student-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="student-main">
          <div className="student-topbar">
            <div className="student-topbar-title">Dashboard</div>
          </div>

          <div className="student-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
