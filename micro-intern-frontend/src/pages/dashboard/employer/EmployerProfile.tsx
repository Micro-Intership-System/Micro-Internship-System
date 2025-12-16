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
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: any }>("/employer/me");
      setProfile(res.data);
      setFormData({
        name: res.data.name || "",
        companyName: res.data.companyName || "",
        companyWebsite: res.data.companyWebsite || "",
        companyDescription: res.data.companyDescription || "",
        companyLogo: res.data.companyLogo || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setError("");
      await apiPut("/employer/me", formData);
      setEditing(false);
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-600">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Company Profile
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your company information and branding.
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
        {/* Company Logo */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Company Logo URL
          </label>
          {editing ? (
            <input
              type="text"
              value={formData.companyLogo}
              onChange={(e) =>
                setFormData({ ...formData, companyLogo: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="https://example.com/logo.png"
            />
          ) : (
            <div className="flex items-center gap-4">
              {formData.companyLogo ? (
                <img
                  src={formData.companyLogo}
                  alt="Company logo"
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                  No logo
                </div>
              )}
            </div>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Company Name *
          </label>
          {editing ? (
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          ) : (
            <p className="text-sm text-slate-900">{formData.companyName || "—"}</p>
          )}
        </div>

        {/* Contact Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Contact Name
          </label>
          {editing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          ) : (
            <p className="text-sm text-slate-900">{formData.name || "—"}</p>
          )}
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Company Website
          </label>
          {editing ? (
            <input
              type="url"
              value={formData.companyWebsite}
              onChange={(e) =>
                setFormData({ ...formData, companyWebsite: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="https://example.com"
            />
          ) : (
            <p className="text-sm text-slate-900">
              {formData.companyWebsite ? (
                <a
                  href={formData.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
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
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Company Description
          </label>
          {editing ? (
            <textarea
              value={formData.companyDescription}
              onChange={(e) =>
                setFormData({ ...formData, companyDescription: e.target.value })
              }
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Tell us about your company..."
            />
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {formData.companyDescription || "—"}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={handleSave}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setEditing(false);
                loadProfile(); // Reset form
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

