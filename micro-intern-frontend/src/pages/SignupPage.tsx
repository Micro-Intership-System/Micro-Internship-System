import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiPost } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../context/AuthContext";

type Role = "student" | "employer" | "admin";

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as Role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost("/auth/signup", form) as { token: string; user: AuthUser };
      login(data.token, data.user);
      
      if (data.user.role === "employer") {
        navigate("/dashboard/employer");
      } else if (data.user.role === "admin") {
        navigate("/dashboard/admin");
      } else {
        navigate("/dashboard/student");
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        {/* top heading like login page */}
        <div className="login-hero">
          <div className="login-brand">MI</div>
          <div className="login-tagline">
            Micro-Internship · Skill-based micro projects for students
          </div>
          <h1 className="login-hero-title">
            Start building your experience today.
          </h1>
          <p className="login-hero-text">
            Create an account to access micro-internships, connect with employers, and build a portfolio that showcases your skills.
          </p>
          <ul className="login-hero-list">
            <li>Join a community of students and employers.</li>
            <li>Earn while you learn with paid micro-internships.</li>
            <li>Build a portfolio that stands out to employers.</li>
          </ul>
        </div>

        {/* main layout: hero text (left) + form card (right) */}
        <div className="login-main">
          <div /> {/* left column empty for now; hero is above */}
          <div className="login-card">
            <h2>Sign up</h2>
            <p className="login-card-subtitle">
              Create your account. Choose your role and get started.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="login-input"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="login-input"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="login-input"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="login-field">
                <span className="login-role-label">Sign up as</span>
                <div className="login-role-toggle">
                  {(["student", "employer", "admin"] as Role[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      className={
                        "login-role-button" +
                        (form.role === r ? " login-role-button--active" : "")
                      }
                      onClick={() => setForm({ ...form, role: r })}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="login-error">{error}</div>}

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="login-footer-text">
              Already have an account?{" "}
              <Link to="/login" className="login-footer-link">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
