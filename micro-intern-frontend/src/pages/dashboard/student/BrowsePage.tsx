import React, { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

type Internship = {
  _id: string;
  title: string;
  employer: string;
  location: string;
  duration: string;
  budget: number;
  skills?: string[];
  createdAt?: string;
  updatedAt?: string; // ← ADD
};


const BrowsePage: React.FC = () => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInternships() {
      try {
        setLoading(true);
        setError(null);

        // call your real backend
        const res = await apiGet("/internships");

        // expecting: { success: true, data: [...] }
        if (!res || res.success === false || !Array.isArray(res.data)) {
          throw new Error(res?.message || "Failed to load internships");
        }

        // newest first
        const sorted = [...res.data].reverse();
        setInternships(sorted);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Could not fetch internships");
      } finally {
        setLoading(false);
      }
    }

    fetchInternships();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-semibold">Browse Jobs</h1>

      {loading && <p className="text-sm text-slate-500">Loading internships…</p>}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && internships.length === 0 && (
        <p className="text-sm text-slate-500">
          No internships found yet. Ask an employer to post one from their dashboard.
        </p>
      )}

      <div className="space-y-4">
        {internships.map((job) => (
          <article
            key={job._id}
            className="border border-slate-200 rounded-lg bg-white px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div className="space-y-1 text-sm">
              <h2 className="font-semibold">{job.title}</h2>
              <p className="text-xs text-slate-500">
                {job.employer} · {job.location}
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-medium">Duration:</span> {job.duration}
              </p>
              {job.skills && job.skills.length > 0 && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium">Skills:</span>{" "}
                  {job.skills.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <p className="text-xs text-slate-600">
                Budget: {job.budget} BDT
              </p>
              <p className="text-xs text-slate-500">
                Updated {timeAgo(job.updatedAt)}
              </p>

              <button
                className="rounded-full bg-black text-white text-xs px-4 py-1.5 hover:bg-slate-800"
                // later you can navigate to /internships/:id from here
                onClick={() => {
                  window.location.href = `/internships/${job._id}`;
                }}
              >
                View Details
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* remove real pagination for now; show simple info instead */}
      <div className="flex justify-end mt-4 text-xs text-slate-500">
        Showing {internships.length} job{internships.length === 1 ? "" : "s"}
      </div>
    </div>
  );
};

export default BrowsePage;
