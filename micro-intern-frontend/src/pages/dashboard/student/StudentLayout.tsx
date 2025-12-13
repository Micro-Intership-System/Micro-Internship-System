import React from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../../context/auth.context";

const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top nav – same for all student pages */}
      <header className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            Micro Internship
          </Link>

          <nav className="flex items-center gap-6 text-xs md:text-sm text-slate-600">
            <Link to="/dashboard/student" className="hover:text-black">
              Home
            </Link>
            <Link to="/dashboard/student/browse" className="hover:text-black">
              Browse Jobs
            </Link>
            <Link to="/dashboard/student/saved" className="hover:text-black">
              Saved
            </Link>
            <Link
              to="/dashboard/student/applications"
              className="hover:text-black"
            >
              Applications
            </Link>

            {user ? (
              <>
                <span className="hidden md:inline text-xs text-slate-500">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="text-xs rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="text-xs rounded-full bg-black text-white px-3 py-1 hover:bg-slate-800"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <Outlet />
        </div>
      </main>

      {/* Footer – matches other pages */}
      <footer className="border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-slate-500 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-700 mb-1">Micro Internship</p>
            <p>
              Helping students gain real-world experience through small, paid
              projects.
            </p>
          </div>

          <div className="flex gap-8">
            <div>
              <p className="font-semibold text-slate-700 mb-1">Quick Links</p>
              <ul className="space-y-1">
                <li>Home</li>
                <li>Browse Jobs</li>
                <li>Post Jobs</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-1">Contact Us</p>
              <ul className="space-y-1">
                <li>Email: support@microinternship.com</li>
                <li>Phone: +880 999</li>
                <li>Address: Banana Lane, Merul Badda</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout;
