import { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";

type Application = {
  _id: string;
  status: string;
  internshipId: {
    _id: string;
    title: string;
    companyName: string;
  };
};

type ApplicationsResponse = {
  success: boolean;
  data: Application[];
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<ApplicationsResponse>("/applications/me")
      .then(res => {
        if (res.success) setApps(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading applications…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Applications</h1>

      {apps.length === 0 ? (
        <p className="text-sm text-slate-500">
          You haven’t applied to any jobs yet.
        </p>
      ) : (
        <div className="space-y-3">
          {apps.map((app, index) => (
  <div
    key={app._id}
    className="rounded-xl border border-slate-200 bg-white p-4"
  >
    <div className="font-medium text-slate-900">
      {index + 1}. {app.internshipId.title}
    </div>

    <div className="text-sm text-slate-600">
      {app.internshipId.companyName}
    </div>

    <div className="mt-1 text-xs text-slate-500">
      Status: {app.status || "Evaluating"}
    </div>
  </div>
))};

        </div>
      )}
    </div>
  );
}
