import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiGet, apiPut } from "../../../api/client";
import EmployerReviewsDisplay from "../../../components/EmployerReviewsDisplay";
import "./css/EmployerProfile.css";

export default function EmployerProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    companyWebsite: "",
    companyDescription: "",
    companyLogo: "",
  });
  const [originalCompanyName, setOriginalCompanyName] = useState("");
  const [companyNameChangeCount, setCompanyNameChangeCount] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await apiGet<{ success: boolean; data: any }>("/employer/me");

      if (res.success) {
        setProfile(res.data);

        const companyName = res.data.companyName || "";
        setOriginalCompanyName(companyName);

        setFormData({
          name: res.data.name || user?.name || "",
          companyName,
          companyWebsite: res.data.companyWebsite || "",
          companyDescription: res.data.companyDescription || "",
          companyLogo: res.data.companyLogo || "",
        });

        setError("");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load profile";

      if (
        errorMessage.includes("Access denied") ||
        errorMessage.includes("employer account required")
      ) {
        setError(
          "Your account role may need to be updated. Please contact admin or try logging out and back in."
        );
      } else if (
        errorMessage &&
        !errorMessage.includes("Failed to load profile") &&
        !errorMessage.includes("Unauthorized")
      ) {
        setError(errorMessage);
      }

      // Fallback so form still shows
      if (!profile && user) {
        const fallbackProfile = {
          name: user.name || "",
          email: user.email || "",
          companyName: "",
          companyWebsite: "",
          companyDescription: "",
          companyLogo: "",
        };

        setProfile(fallbackProfile);

        setFormData({
          name: user.name || "",
          companyName: "",
          companyWebsite: "",
          companyDescription: "",
          companyLogo: "",
        });

        setError("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setError("");
      setSuccess("");

      // Track company name changes
      if (formData.companyName !== originalCompanyName && originalCompanyName) {
        setCompanyNameChangeCount((prev) => prev + 1);
      }

      await apiPut("/employer/me", formData);

      setSuccess("Profile updated successfully");
      setEditing(false);
      await loadProfile();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update profile";

      if (
        errorMessage.includes("Access denied") ||
        errorMessage.includes("employer account required")
      ) {
        setError("Your account role may need to be updated. Please contact admin.");
      } else {
        setError(errorMessage);
      }
    }
  }

  if (loading) {
    return (
      <div className="employer-profile">
        <div className="loading">
          <div className="text">Loading profile…</div>
        </div>
      </div>
    );
  }

  const displayProfile =
    profile ||
    (user
      ? {
          name: user.name || "",
          email: user.email || "",
          companyName: "",
          companyWebsite: "",
          companyDescription: "",
          companyLogo: "",
        }
      : null);

  if (!displayProfile) {
    return (
      <div className="employer-profile">
        <div className="alert error">
          Unable to load profile. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="employer-profile space-y-8">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Company Profile</h1>
          <p className="subtitle">Manage your company information and branding</p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              if (!profile && user) {
                setFormData({
                  name: user.name || "",
                  companyName: formData.companyName || "",
                  companyWebsite: formData.companyWebsite || "",
                  companyDescription: formData.companyDescription || "",
                  companyLogo: formData.companyLogo || "",
                });
              }
            }}
            className="btn btn-primary"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Success/Error */}
      {success && <div className="alert success">{success}</div>}

      {error && error.trim() && <div className="alert error">{error}</div>}

      {/* Anomaly Warning */}
      {companyNameChangeCount > 1 && (
        <div className="alert warning">
          <div className="title">⚠️ Company Name Change Alert</div>
          <div>
            You have updated your company name more than once. This will be
            reported as an anomaly to the admin for review.
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {user?.id && !editing && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <EmployerReviewsDisplay employerId={user.id} />
        </div>
      )}

      {/* Profile Form */}
      <div className="card">
        {/* Company Logo */}
        <div className="section">
          <label>
            Company Logo URL <span className="muted">(Optional)</span>
          </label>

          {editing ? (
            <input
              type="text"
              value={formData.companyLogo}
              onChange={(e) =>
                setFormData({ ...formData, companyLogo: e.target.value })
              }
              placeholder="https://example.com/logo.png"
            />
          ) : (
            <div className="logo-row">
              {formData.companyLogo ? (
                <img
                  src={formData.companyLogo}
                  alt="Company logo"
                  className="logo-img"
                />
              ) : (
                <div className="logo-placeholder">No logo</div>
              )}
            </div>
          )}
        </div>

        {/* Company Name */}
        <div className="section">
          <label>Company Name *</label>

          {editing ? (
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              required
            />
          ) : (
            <p className="value">{formData.companyName || "—"}</p>
          )}
        </div>

        {/* Contact Name */}
        <div className="section">
          <label>Contact Name</label>

          {editing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          ) : (
            <p className="value">{formData.name || "—"}</p>
          )}
        </div>

        {/* Website */}
        <div className="section">
          <label>
            Company Website <span className="muted">(Optional)</span>
          </label>

          {editing ? (
            <input
              type="url"
              value={formData.companyWebsite}
              onChange={(e) =>
                setFormData({ ...formData, companyWebsite: e.target.value })
              }
              placeholder="https://example.com"
            />
          ) : (
            <p className="value">
              {formData.companyWebsite ? (
                <a
                  href={formData.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {formData.companyWebsite}
                </a>
              ) : (
                "—"
              )}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="section">
          <label>Company Description</label>

          {editing ? (
            <textarea
              value={formData.companyDescription}
              onChange={(e) =>
                setFormData({ ...formData, companyDescription: e.target.value })
              }
              rows={4}
              placeholder="Tell us about your company..."
            />
          ) : (
            <p className="description">{formData.companyDescription || "—"}</p>
          )}
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="actions">
            <button type="button" onClick={handleSave} className="btn btn-primary">
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => {
                setEditing(false);
                loadProfile();
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
