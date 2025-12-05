import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const StudentLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Temporary header, replace with global header later */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4">
          <span className="font-semibold text-lg">Micro Internship</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {user?.name} ({user?.role})
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

      {/* Body with sidebar + page content */}
      <div className="flex flex-1 max-w-6xl mx-auto w-full py-6 px-4 gap-6">
        
        {/* Sidebar */}
        <aside className="w-56 bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-1 text-sm">
          <h2 className="font-semibold text-gray-800 mb-2">Student Menu</h2>

          <NavLink 
            to="" 
            end
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg ${isActive ? "bg-black text-white" : "hover:bg-gray-100"}`
            }
          >
            Overview
          </NavLink>

          <NavLink 
            to="browse"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg ${isActive ? "bg-black text-white" : "hover:bg-gray-100"}`
            }
          >
            Browse Jobs
          </NavLink>

          <NavLink 
            to="saved"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg ${isActive ? "bg-black text-white" : "hover:bg-gray-100"}`
            }
          >
            Saved Jobs
          </NavLink>

          <NavLink 
            to="applications"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg ${isActive ? "bg-black text-white" : "hover:bg-gray-100"}`
            }
          >
            Applications
          </NavLink>

          <NavLink 
            to="profile"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg ${isActive ? "bg-black text-white" : "hover:bg-gray-100"}`
            }
          >
            Profile
          </NavLink>

          <NavLink 
            to="messages"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg ${isActive ? "bg-black text-white" : "hover:bg-gray-100"}`
            }
          >
            Messages
          </NavLink>

        </aside>

        {/* Nested routed pages render here */}
        <main className="flex-1">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default StudentLayout;
