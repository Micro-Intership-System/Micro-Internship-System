import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiPost } from "../api/client";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "employer" | "admin">("student");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50 flex items-center justify-center px-4">
      <div className="max-w-5xl w-full flex flex-col md:flex-row bg-slate-900/80 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden backdrop-blur">
        {/* Left: branding / hero */}
        <div className="hidden md:flex md:w-1/2 flex-col justify-between p-8 border-r border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.35),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(45,212,191,0.3),_transparent_55%)]">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-9 w-9 rounded-2xl bg-slate-900/70 border border-slate-700 flex items-center justify-center text-xs font-semibold tracking-tight">
                MI
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-slate-300">Micro-Internship</span>
                <span className="text-[11px] text-slate-400">
                  Skill-based micro projects for students
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-semibold leading-tight mb-3">
              Turn small tasks into{" "}
              <span className="bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">
                big experience.
              </span>
            </h1>
            <p className="text-sm text-slate-300/80 mb-6 max-w-sm">
              Log in to find micro-internships, track applications, and build a
              portfolio that actually shows what you can do.
            </p>

            <div className="space-y-3 text-xs text-slate-300/80">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-emerald-300/60 flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Quick, paid micro-internships from real employers.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-sky-300/60 flex items-center justify-center text-[10px]">
                  ✓
                </span>
                <span>Certificates and reviews you can show on your CV.</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400/80">
            Built for students who are tired of “experience required” postings.
          </div>
        </div>

        {/* Right: form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-2">Log in</h2>
          <p className="text-xs text-slate-400 mb-6">
            Welcome back. Choose your role and continue.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@bracu.ac.bd"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-300 mb-1.5">
                Login as
              </span>
              <div className="flex gap-2 text-xs">
                {(["student", "employer", "admin"] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={[
                      "flex-1 rounded-full border px-3 py-1.5 capitalize transition",
                      role === r
                        ? "bg-sky-500 text-slate-900 border-sky-400 shadow-sm"
                        : "bg-slate-900/40 text-slate-300 border-slate-700 hover:border-slate-500"
                    ].join(" ")}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-300 bg-red-900/40 border border-red-700/60 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-sky-500 hover:bg-sky-400 text-slate-900 text-sm font-semibold py-2.5 mt-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Continue"}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-4">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="text-sky-300 hover:text-sky-200 underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
