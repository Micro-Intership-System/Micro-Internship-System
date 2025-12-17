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

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/dashboard/student", label: "Home" },
    { to: "/dashboard/student/browse", label: "Browse Jobs" },
    { to: "/dashboard/student/applications", label: "Applications" },
    { to: "/dashboard/student/running-jobs", label: "Running Jobs" },
    { to: "/dashboard/student/messages", label: "Messages" },
    { to: "/dashboard/student/courses", label: "Courses" },
    { to: "/dashboard/student/payments", label: "Payments" },
    { to: "/dashboard/student/certificates", label: "Certificates" },
    { to: "/dashboard/student/leaderboard", label: "Leaderboard" },
    { to: "/dashboard/student/portfolio", label: "Portfolio" },
    { to: "/dashboard/student/notifications", label: "Notifications" },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard/student" className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-sm font-semibold text-[#111827]">MI</span>
              <span className="text-sm text-[#6b7280] hidden sm:inline">Micro-Internship</span>
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
                          {user?.name?.charAt(0).toUpperCase() || "S"}
                        </div>
                        <div className="hidden lg:block text-right">
                          <div className="text-sm font-semibold text-[#111827]">{user?.name ?? "Student"}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-[#111827]">MI</span>
                <span className="text-sm text-[#6b7280]">Micro-Internship</span>
              </div>
              <p className="text-sm text-[#6b7280] leading-relaxed">
                Helping students build real experience through small, paid projects.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-[#6b7280]">
                <li><Link to="/dashboard/student/browse" className="hover:text-[#111827] transition-colors">Browse Jobs</Link></li>
                <li><Link to="/dashboard/student/courses" className="hover:text-[#111827] transition-colors">Courses</Link></li>
                <li><Link to="/dashboard/student/leaderboard" className="hover:text-[#111827] transition-colors">Leaderboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Contact</h3>
              <ul className="space-y-1.5 text-sm text-[#6b7280]">
                <li>support@microinternship.com</li>
                <li>+880 999</li>
                <li>Banana Lane, Merul Badda</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#e5e7eb] mt-8 pt-6 text-center text-xs text-[#9ca3af]">
            © {new Date().getFullYear()} Micro Internship. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
