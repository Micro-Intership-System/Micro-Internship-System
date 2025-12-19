import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./css/StudentLayout.css";

function LoginIllustration() {
  return (
    <div className="login-illustration">
      <svg viewBox="0 0 600 300" className="login-illustration-svg">
        <rect width="600" height="300" rx="24" fill="#a78bfa33" />
        <rect x="60" y="70" width="140" height="160" rx="16" fill="#ffffff22" />
        <rect x="230" y="40" width="140" height="200" rx="16" fill="#ffffff22" />
        <rect x="400" y="80" width="140" height="140" rx="16" fill="#ffffff22" />

        <text x="90" y="60" fill="white" fontSize="14">Student</text>
        <text x="260" y="30" fill="white" fontSize="14">Employer</text>
        <text x="430" y="70" fill="white" fontSize="14">Admin</text>
      </svg>
    </div>
  );
}



export default function StudentLayout() {
  // ✅ এখানে তোমার context/auth থেকে user আনলে ভালো
  // এখন demo হিসেবে রাখলাম
  const user = { name: "Student", email: "student@email.com" };

  const nav = [
    { label: "Home", to: "/dashboard/student/overview" },
    { label: "Browse Jobs", to: "/dashboard/student/browse" },
    { label: "Applications", to: "/dashboard/student/applications" },
    { label: "Running Jobs", to: "/dashboard/student/running-jobs" },
    { label: "Messages", to: "/dashboard/student/messages" },
    { label: "Courses", to: "/dashboard/student/course-shop" },
    { label: "Payments", to: "/dashboard/student/payments" },
    { label: "Certificates", to: "/dashboard/student/certificates" },
    { label: "Leaderboard", to: "/dashboard/student/leaderboard" },
    { label: "Portfolio", to: "/dashboard/student/student-portfolio" },
    { label: "Notifications", to: "/dashboard/student/notifications" },
  ];

  function handleLogout() {
    // ✅ এখানে তোমার logout function বসাও
    // example: logout(); navigate("/login");
    console.log("Logout clicked");
  }

  return (
    <div className="student-shell">
      <div className="student-grid">
        {/* Sidebar */}
        <aside className="student-sidebar">
          <div className="student-brand">
            <div className="student-logo" />
            <div>
              <div className="student-brand-title">MiMicro-Internship</div>
              <div className="student-brand-sub">Student Dashboard</div>
            </div>
          </div>

          <nav className="student-nav">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `student-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="student-profile">
            <div className="student-profile-name">{user.name}</div>
            <div className="student-profile-email">{user.email}</div>
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
