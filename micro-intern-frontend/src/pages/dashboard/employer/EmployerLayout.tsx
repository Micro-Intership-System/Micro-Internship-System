import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./css/EmployerLayout.css"; 

export default function EmployerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const nav = [
    { label: "Home", to: "/dashboard/employer" },
    { label: "Profile", to: "/dashboard/employer/profile" },
    { label: "Post Job", to: "/dashboard/employer/post" },
    { label: "My Jobs", to: "/dashboard/employer/jobs" },
    { label: "Applications", to: "/dashboard/employer/applications" },
    { label: "Submissions", to: "/dashboard/employer/submissions" },
    { label: "Messages", to: "/dashboard/employer/messages" },
    { label: "Notifications", to: "/dashboard/employer/notifications" },
  ];

  function handleLogout() {
    // clear auth and redirect to login
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="employer-shell">
      <div className="employer-grid">
        {/* Sidebar */}
        <aside className="employer-sidebar">
          <div className="employer-brand">
            <div className="employer-logo" />
            <div>
              <div className="employer-brand-title">Micro-Internship</div>
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
            <div className="employer-profile-name">{user?.name ?? "Employer"}</div>
            {(user as any)?.organization && (
              <div className="employer-profile-org">{(user as any).organization}</div>
            )}
            <div className="employer-profile-email">{user?.email ?? ""}</div>

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
              <NavLink className="employer-quick" to="/dashboard/employer/post">
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
