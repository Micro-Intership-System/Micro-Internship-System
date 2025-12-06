import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiPost } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Role = "student" | "employer" | "admin";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost("/auth/login", { email, password, role });
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
      else setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        {/* top heading like your screenshot */}
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
            <li>Built for students who are tired of “experience required” postings.</li>
          </ul>
        </div>

        {/* main layout: hero text (left) + form card (right) */}
        <div className="login-main">
          <div /> {/* left column empty for now; hero is above */}
          <div className="login-card">
            <h2>Log in</h2>
            <p className="login-card-subtitle">
              Welcome back. Choose your role and continue.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="login-field">
                <span className="login-role-label">Login as</span>
                <div className="login-role-toggle">
                  {(["student", "employer", "admin"] as Role[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      className={
                        "login-role-button" +
                        (role === r ? " login-role-button--active" : "")
                      }
                      onClick={() => setRole(r)}
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
                {loading ? "Logging in…" : "Continue"}
              </button>
            </form>

            <p className="login-footer-text">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="login-footer-link">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
