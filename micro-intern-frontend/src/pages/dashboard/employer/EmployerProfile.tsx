import React, { useEffect, useState } from "react";
import "../../../EmployerProfile.css";

type Employer = {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyLogo?: string;
  createdAt?: string;
  updatedAt?: string;
};

const EmployerProfile: React.FC = () => {
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/employer/me", {
          method: "GET",
          headers: getAuthHeaders(),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Failed to load profile");
        const data: Employer = body.data;
        setEmployer(data);
        setName(data.name || "");
        setCompanyName(data.companyName || "");
        setCompanyWebsite(data.companyWebsite || "");
        setCompanyDescription(data.companyDescription || "");
        setCompanyLogo(data.companyLogo || "");
      } catch (e: any) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/me", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          companyName,
          companyWebsite,
          companyDescription,
          companyLogo,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Failed to update");
      setEmployer(body.data);
    } catch (e: any) {
      setError(e.message || "Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="emp-page">
        <div className="emp-loading">Loading profile…</div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="emp-page">
        <div className="emp-error">{error || "Unable to load profile."}</div>
      </div>
    );
  }

  return (
    <div className="emp-page">
      {/* top nav */}
      <header className="emp-header">
        <div className="emp-header-inner">
          <div className="emp-logo">Micro Internship</div>
          <nav className="emp-nav">
            <button>Home</button>
            <button>About</button>
            <button>Browse Jobs</button>
            <button>Post Jobs</button>
            <button>How It Works</button>
          </nav>
        </div>
      </header>

      {/* main */}
      <main className="emp-main">
        <section className="emp-hero">
          <h1 className="emp-hero-title">
            Welcome {employer.name ? `Mr. ${employer.name}` : "Employer"}
          </h1>
          <p className="emp-hero-text">
            Manage your organization, verify documents, and post new internship.
          </p>
        </section>

        <section className="emp-section-title">
          <h2>Profile</h2>
        </section>

        <section className="emp-layout">
          {/* left: form */}
          <form className="emp-form" onSubmit={handleSave}>
            {error && <div className="emp-form-error">{error}</div>}

            <div className="emp-field">
              <label>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
              />
            </div>

            <div className="emp-field">
              <label>Email</label>
              <input value={employer.email} disabled />
            </div>

            <div className="emp-field">
              <label>Company name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                type="text"
              />
            </div>

            <div className="emp-field">
              <label>Company website</label>
              <input
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                type="text"
              />
            </div>

            <div className="emp-field">
              <label>Company description</label>
              <textarea
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
              />
            </div>

            <div className="emp-field">
              <label>Logo image URL</label>
              <input
                value={companyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
                type="text"
              />
            </div>

            <div className="emp-actions-top">
              <button type="button" className="emp-btn-secondary">
                Add document
              </button>
              <button type="button" className="emp-btn-verify">
                Verify now!
              </button>
            </div>

            <div className="emp-actions-bottom">
              <button
                type="submit"
                className="emp-btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>

          {/* right: avatar card */}
          <aside className="emp-avatar-card">
            <div className="emp-avatar-wrapper">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Company logo"
                  className="emp-avatar-img"
                />
              ) : (
                <div className="emp-avatar-placeholder">Logo</div>
              )}
            </div>
          </aside>
        </section>
      </main>

      {/* footer (simple) */}
      <footer className="emp-footer">
        <div className="emp-footer-inner">
          <div className="emp-footer-brand">Micro Internship</div>
          <div className="emp-footer-meta">
            <span>support@microinternship.com</span>
            <span>+889 909</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmployerProfile;
