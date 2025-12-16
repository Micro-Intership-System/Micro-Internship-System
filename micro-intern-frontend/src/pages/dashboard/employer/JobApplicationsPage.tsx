import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPut } from "../../../api/client";
import { Link } from "react-router-dom";


type ApplicationStatus = "evaluating" | "accepted" | "rejected";

type Application = {
  _id: string;
  status: ApplicationStatus;
  studentId: {
    _id: string;
    name: string;
    email: string;
    institution?: string;
    skills?: string[];
    bio?: string;
    profilePicture?: string;
    portfolio?: unknown;
  };
};

type Response = {
  success: boolean;
  data: Application[];
};

export default function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    apiGet<Response>(`/employer/jobs/${id}/applications`)
      .then(res => {
        if (res.success) setApps(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(
    appId: string,
    status: "accepted" | "rejected"
  ) {
    await apiPut(`/employer/applications/${appId}/status`, { status });

    setApps(prev =>
      prev.map(app =>
        app._id === appId ? { ...app, status } : app
      )
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading applications…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Applications</h1>

      {apps.length === 0 ? (
        <p className="text-sm text-slate-500">
          No applications yet.
        </p>
      ) : (
        apps.map((app, index) => (
          <div
            key={app._id}
            className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
          >
            <div className="font-medium">
              {index + 1}. {app.studentId.name}
            </div>

            <div className="text-sm text-slate-600">
              {app.studentId.email}
            </div>

            <div className="text-xs text-slate-500">
              Status: {app.status}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                disabled={app.status !== "evaluating"}
                onClick={() => updateStatus(app._id, "accepted")}
                className="rounded border px-3 py-1 text-xs font-medium disabled:opacity-50"
              >
                Accept
              </button>

              <button
                disabled={app.status !== "evaluating"}
                onClick={() => updateStatus(app._id, "rejected")}
                className="rounded border px-3 py-1 text-xs font-medium disabled:opacity-50"
              >
                Reject
              </button>
              
            </div>
          <Link to={`/dashboard/employer/students/${app.studentId._id}`}
                className="rounded border px-3 py-1 text-xs font-medium hover:bg-slate-50"
              >
                View portfolio
              </Link>

          </div>
        ))
      )}
    </div>
  );
}
