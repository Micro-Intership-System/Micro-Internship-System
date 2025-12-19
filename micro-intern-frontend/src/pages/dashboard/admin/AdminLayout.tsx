import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useState } from "react";
import "./AdminLayout.css";


function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
      end
    >
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/dashboard/admin", label: "Dashboard" },
    { to: "/dashboard/admin/anomalies", label: "Anomalies" },
    { to: "/dashboard/admin/students", label: "Students" },
    { to: "/dashboard/admin/employers", label: "Employers" },
    { to: "/dashboard/admin/chats", label: "All Chats" },
    { to: "/dashboard/admin/tasks", label: "All Tasks" },
  ];

  const initial = (user?.name?.charAt(0) || "A").toUpperCase();

  return (
    <div className="admin-shell">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-inner">
          {/* Brand */}
          <Link to="/dashboard/admin" className="admin-brand">
            <div className="admin-logo">MI</div>
            <div className="admin-brand-text">
              <div className="admin-brand-title">Admin Dashboard</div>
              <div className="admin-brand-sub">Micro Internship System</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="admin-nav-desktop">
            {navItems.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} />
            ))}
          </nav>

          {/* Right side */}
          <div className="admin-right">
            {/* User info (desktop) */}
            <div className="admin-user">
              <div className="admin-avatar">{initial}</div>
              <div className="admin-user-meta">
                <div className="admin-user-name">{user?.name ?? "Admin"}</div>
                <div className="admin-user-email">{user?.email ?? ""}</div>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="admin-btn admin-btn-ghost admin-mobile-toggle"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>

            {/* Logout */}
            <button onClick={logout} className="admin-btn admin-btn-ghost">
              Logout
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className={`admin-nav-mobile ${mobileMenuOpen ? "open" : ""}`}>
          <div className="admin-nav-mobile-inner">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `admin-nav-chip ${isActive ? "active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="admin-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="admin-footer">
        © {new Date().getFullYear()} Micro Internship Admin Panel. All rights reserved.
      </footer>
    </div>
  );
}
