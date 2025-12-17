import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useState } from "react";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-[#111827] text-white"
            : "text-[#374151] hover:bg-[#f3f4f6]",
        ].join(" ")
      }
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

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard/admin" className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-sm font-semibold text-[#111827]">MI</span>
              <span className="text-sm text-[#6b7280] hidden sm:inline">Admin Dashboard</span>
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-1 ml-8">
              {navItems.map((item) => (
                <NavItem key={item.to} to={item.to} label={item.label} />
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* User Info - Desktop */}
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-[#f9fafb] transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="hidden lg:block text-right">
                  <div className="text-sm font-semibold text-[#111827]">{user?.name ?? "Admin"}</div>
                  <div className="text-xs text-[#6b7280]">{user?.email ?? ""}</div>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 rounded-lg border border-[#e5e7eb] flex items-center justify-center text-[#374151] hover:bg-[#f9fafb] transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#f9fafb] transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden border-t border-[#e5e7eb] bg-white overflow-x-auto">
          <nav className="flex items-center gap-1 px-4 py-2 min-w-max">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200",
                    isActive
                      ? "bg-[#111827] text-white"
                      : "text-[#374151] hover:bg-[#f3f4f6]",
                  ].join(" ")
                }
                end
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] bg-white mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-xs text-[#9ca3af]">
            © {new Date().getFullYear()} Micro Internship Admin Panel. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}


