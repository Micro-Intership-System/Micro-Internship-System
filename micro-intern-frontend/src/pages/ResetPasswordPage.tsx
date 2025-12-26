import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { apiPost } from "../api/client";
import "./LoginPage.css";

type ResetPasswordResponse = {
  success: boolean;
  message: string;
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const data = (await apiPost("/auth/reset-password", {
        token,
        password,
      })) as ResetPasswordResponse;

      if (data.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to reset password. The link may have expired.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-hero">
            <div className="login-brand">MI</div>
            <div className="login-tagline">
              Micro-Internship · Reset your password
            </div>
            <h1 className="login-hero-title">
              Invalid Reset Link
            </h1>
            <p className="login-hero-text">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <div className="login-card">
            <div className="login-error">
              Invalid or missing reset token. Please request a new password reset link.
            </div>
            <p className="login-footer">
              <Link to="/forgot-password">Request a new reset link</Link> or{" "}
              <Link to="/login">Back to login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-hero">
          <div className="login-brand">MI</div>
          <div className="login-tagline">
            Micro-Internship · Reset your password
          </div>
          <h1 className="login-hero-title">
            Create new password
          </h1>
          <p className="login-hero-text">
            Enter your new password below. Make sure it&apos;s strong and secure!
          </p>
        </div>

        {success ? (
          <div className="login-card">
            <div className="login-success">
              <p>✅ Password reset successfully!</p>
              <p style={{ marginTop: "8px", fontSize: "13px", color: "rgba(255,255,255,.70)" }}>
                Redirecting to login...
              </p>
            </div>
          </div>
        ) : (
          <form className="login-card" onSubmit={handleSubmit}>
            <h2 className="login-title">Reset Password</h2>
            <p className="login-subtitle">
              Enter your new password below.
            </p>

            {error && <div className="login-error">{error}</div>}

            <div className="login-field">
              <label>New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                minLength={6}
              />
            </div>

            <div className="login-field">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <p className="login-footer">
              <Link to="/login">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

