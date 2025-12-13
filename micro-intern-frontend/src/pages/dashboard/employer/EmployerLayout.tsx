import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../../context/auth.context";

export default function EmployerLayout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-4 py-4">
          <Link to="/dashboard/employer" className="font-semibold">
            Micro Internship
          </Link>

          <nav className="flex gap-4 text-sm">
            <Link to="/dashboard/employer">Dashboard</Link>
            <Link to="/dashboard/employer/profile">Company Profile</Link>
            <Link to="/dashboard/employer/post">Post Internship</Link>
            <button onClick={logout}>Logout</button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
