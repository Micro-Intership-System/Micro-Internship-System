import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../api/client";
import "./LoginPage.css";

type ForgotPasswordResponse = {
  success: boolean;
  message: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const data = (await apiPost("/auth/forgot-password", {
        email,
      })) as ForgotPasswordResponse;

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "Failed to send reset email");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send password reset email");
      }
    } finally {
      setLoading(false);
    }
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
            Forgot your password?
          </h1>
          <p className="login-hero-text">
            No worries! Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <h2 className="login-title">Reset Password</h2>
          <p className="login-subtitle">
            Enter your email address to receive a password reset link.
          </p>

          {success && (
            <div className="login-success">
              <p>✅ Check your email! We&apos;ve sent a password reset link to <strong>{email}</strong></p>
              <p style={{ marginTop: "8px", fontSize: "13px", color: "rgba(255,255,255,.70)" }}>
                The link will expire in 1 hour.
              </p>
            </div>
          )}

          {error && <div className="login-error">{error}</div>}

          {!success && (
            <>
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

              <button
                type="submit"
                className="login-btn"
                disabled={loading || !email}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </>
          )}

          <p className="login-footer">
            Remember your password? <Link to="/login">Back to login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

