import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const [role, setRole] = useState<"student" | "employer" | "admin">("student");
  const navigate = useNavigate();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // ✅ demo redirect (backend connect করলে এখানে API call হবে)
    if (role === "student") navigate("/dashboard/student/overview");
    if (role === "employer") navigate("/dashboard/employer/overview");
    if (role === "admin") navigate("/dashboard/admin");
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* HERO */}
        <div className="login-hero">
          <div className="login-brand">MI</div>
          <div className="login-tagline">
            Micro-Internship · Skill-based micro projects for students
          </div>

          <h1 className="login-hero-title">
            Turn small tasks into big experience.
          </h1>

          <p className="login-hero-text">
            Log in to find micro-internships, track applications, and build a
            portfolio that actually shows what you can do.
          </p>

          <ul className="login-hero-list">
            <li>Quick, paid micro-internships from real employers.</li>
            <li>Certificates and reviews you can show on your CV.</li>
            <li>Built for students tired of “experience required”.</li>
          </ul>
        </div>

        {/* FORM */}
        <form className="login-card" onSubmit={handleLogin}>
          <h2 className="login-title">Log in</h2>
          <p className="login-subtitle">Welcome back. Choose your role and continue.</p>

          <div className="login-field">
            <label>Email address</label>
            <input type="email" placeholder="you@email.com" required />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" required />
          </div>

          <div className="login-field">
            <label>Login as</label>
            <div className="login-role">
              <button
                type="button"
                className={role === "student" ? "active" : ""}
                onClick={() => setRole("student")}
              >
                Student
              </button>
              <button
                type="button"
                className={role === "employer" ? "active" : ""}
                onClick={() => setRole("employer")}
              >
                Employer
              </button>
              <button
                type="button"
                className={role === "admin" ? "active" : ""}
                onClick={() => setRole("admin")}
              >
                Admin
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn">
            Continue
          </button>

          <p className="login-footer">
            Don&apos;t have an account? <Link to="/signup">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
