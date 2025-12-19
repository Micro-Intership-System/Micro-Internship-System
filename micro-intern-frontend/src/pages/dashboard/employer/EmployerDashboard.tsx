import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./EmployerDashboard.css";

export default function EmployerDashboard() {
  const { user } = useAuth();

  return (
    <div className="employer-dash space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Employer Dashboard</h1>
        <p className="subtitle">
          Welcome back, {user?.name || "Employer"}! Manage your micro-internships.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/dashboard/employer/post" className="action-card">
          <div className="icon-box">+</div>
          <h3>Post New Job</h3>
          <p>Create a new micro-internship opportunity</p>
        </Link>

        <Link to="/dashboard/employer/jobs" className="action-card">
          <div className="icon-box">📋</div>
          <h3>My Jobs</h3>
          <p>View and manage your posted jobs</p>
        </Link>

        <Link to="/dashboard/employer/profile" className="action-card">
          <div className="icon-box">⚙️</div>
          <h3>Company Profile</h3>
          <p>Update your company information</p>
        </Link>
      </div>

      <div className="info-card">
        <h2>Getting Started</h2>
        <p>
          Post micro-internships, review applicants, chat with students, and
          release payments securely.
        </p>

        <ul>
          <li>Post jobs with skills & gold rewards</li>
          <li>Review applications & portfolios</li>
          <li>Chat during execution</li>
          <li>Release escrow payments</li>
        </ul>
      </div>
    </div>
  );
}
