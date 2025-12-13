import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const EmployerLayout = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex justify-between items-center py-4 px-4">
          <Link to="/dashboard/employer">Micro Internship</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/dashboard/employer/post">Post Internship</Link>
            <button onClick={logout}>Log out</button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployerLayout;
