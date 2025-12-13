import React from "react";
import { useAuth } from "../../context/auth.context";

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* top nav */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4">
          <span className="font-semibold text-lg">Micro Internship</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {user ? `${user.name} (${user.role})` : ""}
            </span>
            <button
              onClick={logout}
              className="px-3 py-1 rounded-full border border-gray-300 text-sm"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* main content */}
      <div className="flex flex-1 max-w-6xl mx-auto w-full py-6 px-4 gap-6">
        {/* sidebar */}
        <aside className="w-56 bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2 text-sm">
          <span className="font-semibold text-gray-800 mb-2">
            Student Dashboard
          </span>
          <button className="text-left px-3 py-2 rounded-lg bg-black text-white">
            Overview
          </button>
          <button className="text-left px-3 py-2 rounded-lg hover:bg-gray-100">
            Browse Jobs
          </button>
          <button className="text-left px-3 py-2 rounded-lg hover:bg-gray-100">
            Saved Jobs
          </button>
          <button className="text-left px-3 py-2 rounded-lg hover:bg-gray-100">
            Applications
          </button>
          <button className="text-left px-3 py-2 rounded-lg hover:bg-gray-100">
            Profile
          </button>
          <button className="text-left px-3 py-2 rounded-lg hover:bg-gray-100">
            Messages
          </button>
        </aside>

        {/* main panel */}
        <main className="flex-1">
          <section className="mb-6">
            <h1 className="text-2xl font-semibold mb-1">
              Welcome back, {user?.name || "Student"} 👋
            </h1>
            <p className="text-sm text-gray-500">
              Track your micro-internship applications, explore new tasks, and
              update your profile.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-2">Active Applications</p>
              <p className="text-2xl font-semibold">3</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-2">Saved Jobs</p>
              <p className="text-2xl font-semibold">5</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-2">Completed Internships</p>
              <p className="text-2xl font-semibold">1</p>
            </div>
          </section>

          {/* you can replace this section later with the Figma cards/list */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">
              Recommended Micro-Internships
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Based on your skills and interests.
            </p>
            <div className="space-y-3 text-sm">
              <div className="border rounded-xl px-3 py-2 flex justify-between">
                <div>
                  <p className="font-medium">UX Research Assistant</p>
                  <p className="text-gray-500 text-xs">
                    Nyancom Ltd. • Remote • 3 weeks
                  </p>
                </div>
                <button className="text-xs px-3 py-1 rounded-full bg-black text-white">
                  View details
                </button>
              </div>
              {/* Add more placeholder cards if you want */}
            </div>
          </section>
        </main>
      </div>

      <footer className="border-t bg-white mt-4">
        <div className="max-w-6xl mx-auto py-4 px-4 text-xs text-gray-500 flex justify-between">
          <span>© {new Date().getFullYear()} Micro Internship</span>
          <span>Browse Jobs • Post Jobs • How It Works</span>
        </div>
      </footer>
    </div>
  );
};

export default StudentDashboard;
