import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost } from "../api/client";

type Internship = {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  duration: string;
  budget: number;
  skills?: string[];
  description?: string;
  updatedAt?: string;
};

type InternshipResponse = {
  success: boolean;
  data: Internship;
};

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function InternshipDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [job, setJob] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);

  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    apiGet<InternshipResponse>(`/internships/${id}`)
      .then(res => {
        if (res.success) setJob(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function apply() {
    if (!job) return;

    try {
      setApplying(true);
      setError("");

      await apiPost("/applications", {
        internshipId: job._id,
      });

      setApplied(true);
    } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Failed to apply.");
  }
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (!job) {
    return <p className="text-sm text-red-500">Job not found.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {job.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {job.companyName} · Updated {timeAgo(job.updatedAt)}
        </p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
        <div>
          <span className="font-medium">Location:</span> {job.location}
        </div>
        <div>
          <span className="font-medium">Duration:</span> {job.duration}
        </div>
        <div>
          <span className="font-medium">Budget:</span> {job.budget} BDT
        </div>
        <div>
          <span className="font-medium">Skills:</span>{" "}
          {job.skills?.join(", ") || "—"}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Description</h2>
        <p className="text-slate-700 whitespace-pre-line">
          {job.description || "No description provided."}
        </p>
      </div>

      {/* Actions */}
      <div className="pt-4 space-y-2">
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={apply}
          disabled={applied || applying}
          className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {applied ? "Applied ✓" : applying ? "Applying…" : "Apply now"}
        </button>
      </div>
    </div>
  );
}
