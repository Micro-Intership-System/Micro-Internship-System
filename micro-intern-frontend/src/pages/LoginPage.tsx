import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiPost("/auth/login", { email, password, role }) as { token: string; user: { id: string; name: string; email: string; role: string } };
      login(data.token, data.user);
      // redirect based on role
      if (data.user.role === "employer") {
        navigate("/dashboard/employer");
      } else if (data.user.role === "admin") {
        navigate("/dashboard/admin");
      } else {
        navigate("/dashboard/student");
      }
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("Login failed");
        }
    }
 finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* top nav to match Figma */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4">
          <span className="font-semibold text-lg">Micro Internship</span>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <button className="hover:text-black">Home</button>
            <button className="hover:text-black">Browse Jobs</button>
            <button className="hover:text-black">Post Jobs</button>
            <button className="hover:text-black">How It Works</button>
            <button className="px-3 py-1 rounded-full border border-gray-300 text-sm">
              <Link to="/signup">Sign Up</Link>
            </button>
          </nav>
        </div>
      </header>

      {/* center login card */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
          <h1 className="text-2xl font-semibold mb-2">Log in</h1>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to access your micro-internship dashboard.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Role selector (radio pill, similar to Figma toggle) */}
            <div>
              <span className="block text-sm font-medium mb-1">Login as</span>
              <div className="flex gap-2">
                {["student", "employer", "admin"].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r as "student" | "employer" | "admin")}
                    className={`flex-1 text-sm rounded-full border px-3 py-1 ${
                      role === r
                        ? "bg-black text-white border-black"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-full py-2 text-sm font-semibold hover:bg-gray-900 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
      </main>

      {/* footer like other pages */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto py-4 px-4 text-xs text-gray-500 flex justify-between">
          <span>© {new Date().getFullYear()} Micro Internship</span>
          <span>Support: support@microinternship.com</span>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
