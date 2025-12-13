import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../../api/client";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type Job = {
  _id: string;
  title: string;
  priorityLevel?: "low" | "medium" | "high";
  createdAt?: string;
  updatedAt?: string;
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
}

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    apiGet<ApiResponse<Job[]>>("/employer/jobs").then((res) => {
      const sorted = [...res.data].sort((a, b) => {
        const at = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const bt = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return bt - at;
      });
      setJobs(sorted);
    });
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Job Posts</h1>

      {jobs.length === 0 && (
        <div className="border border-slate-200 rounded-lg bg-white px-4 py-6 text-sm text-slate-600">
          You haven’t posted any jobs yet.
        </div>
      )}

      {jobs.map((job) => (
        <div
          key={job._id}
          className="border border-slate-200 rounded-lg bg-white p-4 flex justify-between"
        >
          <div>
            <h2 className="font-medium">{job.title}</h2>
            <p className="text-xs text-slate-500">
              {job.priorityLevel && <>Priority: {job.priorityLevel} · </>}
              Updated {timeAgo(job.updatedAt ?? job.createdAt)}
            </p>
          </div>

          <Link
            to={`/dashboard/employer/jobs/${job._id}/edit`}
            className="text-sm underline"
          >
            Edit
          </Link>
        </div>
      ))}
    </div>
  );
}
