import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./css/EmployerLayout.css";

export default function EmployerLayout() {
  // ✅ replace with real employer user from auth/context
  const employer = {
    name: "Employer",
    email: "employer@email.com",
    org: "Your Company",
  };

  const nav = [
    { label: "Home", to: "/dashboard/employer/overview" },
    { label: "Post Job", to: "/dashboard/employer/post-job" },
    { label: "My Jobs", to: "/dashboard/employer/my-jobs" },
    { label: "Applications", to: "/dashboard/employer/applications" },
    { label: "Running Jobs", to: "/dashboard/employer/running-jobs" },
    { label: "Messages", to: "/dashboard/employer/messages" },
    { label: "Payments", to: "/dashboard/employer/payments" },
    { label: "Certificates", to: "/dashboard/employer/certificates" },
    { label: "Reviews", to: "/dashboard/employer/reviews" },
    { label: "Notifications", to: "/dashboard/employer/notifications" },
    { label: "Profile", to: "/dashboard/employer/profile" },
  ];

  function handleLogout() {
    // ✅ put your logout logic here
    console.log("Employer logout");
  }

  return (
    <div className="employer-shell">
      <div className="employer-grid">
        {/* Sidebar */}
        <aside className="employer-sidebar">
          <div className="employer-brand">
            <div className="employer-logo" />
            <div>
              <div className="employer-brand-title">MiMicro-Internship</div>
              <div className="employer-brand-sub">Employer Dashboard</div>
            </div>
          </div>

          <nav className="employer-nav">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `employer-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="employer-profile">
            <div className="employer-profile-name">{employer.name}</div>
            <div className="employer-profile-org">{employer.org}</div>
            <div className="employer-profile-email">{employer.email}</div>

            <button className="employer-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="employer-main">
          <div className="employer-topbar">
            <div className="employer-topbar-title">Employer</div>

            <div className="employer-topbar-actions">
              <NavLink className="employer-quick" to="/dashboard/employer/post-job">
                + Post Job
              </NavLink>
            </div>
          </div>

          <div className="employer-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
