import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-3 py-2 rounded-xl text-sm font-medium transition",
          isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">MI</span>
            <span className="text-sm text-slate-500">Micro-Internship</span>
          </Link>

          <nav className="flex items-center gap-2 flex-wrap">
            <NavItem to="/dashboard/student" label="Home" />
            <NavItem to="/dashboard/student/browse" label="Browse Jobs" />
            <NavItem to="/dashboard/student/applications" label="Applications" />
            <NavItem to="/dashboard/student/courses" label="Courses" />
            <NavItem to="/dashboard/student/leaderboard" label="Leaderboard" />
            <NavItem to="/dashboard/student/portfolio" label="Portfolio" />
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-slate-900">{user?.name ?? "Student"}</div>
              <div className="text-xs text-slate-500">{user?.email ?? ""}</div>
            </div>
            <button
              onClick={logout}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600">
          Helping students build real experience through small, paid projects.
        </div>
      </footer>
    </div>
  );
}
