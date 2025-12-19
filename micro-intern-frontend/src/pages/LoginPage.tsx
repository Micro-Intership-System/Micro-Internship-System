import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiPost } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

type Role = "student" | "employer" | "admin";

type User = {
  id?: string;
  name?: string;
  email?: string;
  role: Role;
  organization?: string;
};

type LoginResponse = {
  token: string;
  user: User;
};

function isRole(x: unknown): x is Role {
  return x === "student" || x === "employer" || x === "admin";
}

function getDashboardPath(role: Role) {
  if (role === "student") return "/dashboard/student";
  if (role === "employer") return "/dashboard/employer";
  return "/dashboard/admin";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // If your apiPost isn't generic-typed, we cast locally so TS stops red marking.
      const data = (await apiPost("/auth/login", {
        email,
        password,
        role,
      })) as LoginResponse;

      if (!data?.token || !data?.user) {
        throw new Error("Invalid login response from server");
      }

      login(data.token, data.user);

      // Backend is source of truth; fallback to selected role if backend doesn't send role
      const serverRole = data.user.role;
      const finalRole: Role = isRole(serverRole) ? serverRole : role;

      navigate(getDashboardPath(finalRole), { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Login failed");
    } finally {
      setLoading(false);
    }
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
          <p className="login-subtitle">
            Welcome back. Choose your role and continue.
          </p>

          <div className="login-field">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label>Login as</label>
            <div className="login-role">
              {(["student", "employer", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={role === r ? "active" : ""}
                  onClick={() => setRole(r)}
                  disabled={loading}
                  aria-pressed={role === r}
                >
                  {r[0].toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !email || !password}
          >
            {loading ? "Logging in…" : "Continue"}
          </button>

          <p className="login-footer">
            Don&apos;t have an account? <Link to="/signup">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
