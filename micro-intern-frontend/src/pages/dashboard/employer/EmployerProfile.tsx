import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiGet, apiPut } from "../../../api/client";

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
          companyName: companyName,
          companyWebsite: res.data.companyWebsite || "",
          companyDescription: res.data.companyDescription || "",
          companyLogo: res.data.companyLogo || "",
        });
        // Clear any previous errors on successful load
        setError("");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load profile";
      // Don't show "log in again" - just show the actual error or allow editing with empty profile
      if (errorMessage.includes("Access denied") || errorMessage.includes("employer account required")) {
        setError("Your account role may need to be updated. Please contact admin or try logging out and back in.");
      } else if (errorMessage && !errorMessage.includes("Failed to load profile") && !errorMessage.includes("Unauthorized")) {
        setError(errorMessage);
      }
      // Even if API fails, allow editing with user context data
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
        setError(""); // Clear error so form can be shown
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
        setCompanyNameChangeCount(prev => prev + 1);
      }
      
      await apiPut("/employer/me", formData);
      setSuccess("Profile updated successfully");
      setEditing(false);
      await loadProfile();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      if (errorMessage.includes("Access denied") || errorMessage.includes("employer account required")) {
        setError("Your account role may need to be updated. Please contact admin.");
      } else {
        setError(errorMessage);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading profile…</div>
      </div>
    );
  }

  // Always show the profile form if user is logged in - use fallback profile if API failed
  const displayProfile = profile || (user ? {
    name: user.name || "",
    email: user.email || "",
    companyName: "",
    companyWebsite: "",
    companyDescription: "",
    companyLogo: "",
  } : null);

  if (!displayProfile) {
    return (
      <div className="space-y-8">
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          Unable to load profile. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-2">Company Profile</h1>
          <p className="text-sm text-[#6b7280]">Manage your company information and branding</p>
        </div>
        {!editing && (
          <button
            onClick={() => {
              setEditing(true);
              // If profile failed to load, ensure formData has user info
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
            className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors whitespace-nowrap"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Success/Error */}
      {success && (
        <div className="border border-[#a7f3d0] bg-[#d1fae5] rounded-lg px-4 py-3 text-sm text-[#065f46]">
          {success}
        </div>
      )}
      {error && error.trim() && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Anomaly Warning */}
      {companyNameChangeCount > 1 && (
        <div className="border border-[#fde68a] bg-[#fef3c7] rounded-lg px-4 py-3 text-sm text-[#92400e]">
          <div className="font-semibold mb-1">⚠️ Company Name Change Alert</div>
          <div>You have updated your company name more than once. This will be reported as an anomaly to the admin for review.</div>
        </div>
      )}

      {/* Profile Form */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white p-6 space-y-6">
        {/* Company Logo */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
            Company Logo URL <span className="text-[#9ca3af] font-normal">(Optional)</span>
          </label>
          {editing ? (
            <input
              type="text"
              value={formData.companyLogo}
              onChange={(e) =>
                setFormData({ ...formData, companyLogo: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
              placeholder="https://example.com/logo.png"
            />
          ) : (
            <div className="flex items-center gap-4">
              {formData.companyLogo ? (
                <img
                  src={formData.companyLogo}
                  alt="Company logo"
                  className="w-20 h-20 rounded-lg object-cover border border-[#e5e7eb]"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-[#f3f4f6] border border-[#e5e7eb] flex items-center justify-center text-[#9ca3af] text-xs">
                  No logo
                </div>
              )}
            </div>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
            Company Name *
          </label>
          {editing ? (
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
              required
            />
          ) : (
            <p className="text-sm text-[#111827]">{formData.companyName || "—"}</p>
          )}
        </div>

        {/* Contact Name */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
            Contact Name
          </label>
          {editing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
            />
          ) : (
            <p className="text-sm text-[#111827]">{formData.name || "—"}</p>
          )}
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
            Company Website <span className="text-[#9ca3af] font-normal">(Optional)</span>
          </label>
          {editing ? (
            <input
              type="url"
              value={formData.companyWebsite}
              onChange={(e) =>
                setFormData({ ...formData, companyWebsite: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
              placeholder="https://example.com"
            />
          ) : (
            <p className="text-sm text-[#111827]">
              {formData.companyWebsite ? (
                <a
                  href={formData.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#111827] hover:underline"
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
        <div>
          <label className="block text-xs font-medium text-[#374151] mb-2 uppercase tracking-wide">
            Company Description
          </label>
          {editing ? (
            <textarea
              value={formData.companyDescription}
              onChange={(e) =>
                setFormData({ ...formData, companyDescription: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white resize-none"
              placeholder="Tell us about your company..."
            />
          ) : (
            <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">
              {formData.companyDescription || "—"}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="flex gap-3 pt-4 border-t border-[#e5e7eb]">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setEditing(false);
                loadProfile();
              }}
              className="px-6 py-2.5 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
