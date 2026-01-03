import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "../../../api/client";
import "./css/EmployerJobsPage.css"; // reuse jobs styles for consistent look

type App = {
  _id: string;
  internshipId: { _id: string; title: string } | string;
  studentId: { _id: string; name: string; email: string; institution?: string };
  status: string;
  createdAt: string;
};

export default function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: App[] }>("/employer/applications");
      if (res.success) setApplications(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(appId: string, status: "accepted" | "rejected") {
    try {
      await apiPatch(`/employer/applications/${appId}/status`, { status });
      // reload
      await load();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="empJobs__loadingWrap"><div className="empJobs__loadingText">Loading applications…</div></div>;

  if (error) return <div className="empJobs__error">{error}</div>;

  return (
    <div className="empJobs">
      <div className="empJobs__header">
        <div>
          <h1 className="empJobs__title">Applications</h1>
          <p className="empJobs__subtitle">All applications to your posted jobs</p>
        </div>
      </div>

      <div className="empJobs__card">
        <div className="empJobs__cardHeader">
          <div className="empJobs__total">Total: <strong>{applications.length}</strong></div>
        </div>

        <div className="empJobs__list">
          {applications.length === 0 ? (
            <div className="empJobs__empty">
              <p className="empJobs__emptyText">No applications yet.</p>
            </div>
          ) : (
            applications.map((a) => (
              <div key={a._id} className="empJobs__row">
                <div className="empJobs__info">
                  <div className="empJobs__jobTitle">{typeof a.internshipId === 'string' ? "—" : a.internshipId.title}</div>
                  <div className="empJobs__meta">{a.studentId.name} • {a.studentId.email} • {a.studentId.institution}</div>
                  <div className="empJobs__tags">
                    <span className={`empJobs__pill`}>Status: {a.status}</span>
                    <span className="empJobs__mutedInline">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="empJobs__actions">
                  <button onClick={() => updateStatus(a._id, "accepted")} className="empJobs__btnSuccess">Accept</button>
                  <button onClick={() => updateStatus(a._id, "rejected")} className="empJobs__btnOutline">Reject</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
