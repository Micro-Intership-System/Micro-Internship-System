import React, { useState, ChangeEvent } from "react";
import { apiGet } from "../../../api/client";

type Internship = {
  _id: string;
  title: string;
  employer: string;
  location: string;
  duration: string;
  budget: number;
  skills?: string[];
};

const AdvancedSearchPage: React.FC = () => {
  const [q, setQ] = useState<string>("");
  const [skills, setSkills] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  async function handleSearch() {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const params = new URLSearchParams();

      if (q.trim() !== "") params.set("q", q.trim());
      if (skills.trim() !== "") params.set("skills", skills.trim());
      if (duration.trim() !== "") params.set("duration", duration.trim());
      if (budget.trim() !== "") params.set("budget", budget.trim());
      if (location.trim() !== "") params.set("location", location.trim());

      const queryString = params.toString();
      const url =
        queryString.length > 0
          ? `/internships/search?${queryString}`
          : "/internships/search";

      const res = await apiGet(url);

      if (!res || res.success === false || !Array.isArray(res.data)) {
        throw new Error(res?.message || "Failed to load internships");
      }

      setInternships(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Could not fetch internships");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-semibold">Advanced Search</h1>

      <section className="border border-slate-200 rounded-lg bg-white px-4 py-5 space-y-4">
        <h2 className="text-lg font-semibold">Filter Jobs</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Keyword</label>
            <input
              type="text"
              placeholder="search here"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={q}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setQ(e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Skills (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. React, UI/UX"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={skills}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSkills(e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Duration</label>
            <input
              type="text"
              placeholder="e.g. 1-2 weeks"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={duration}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDuration(e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Budget (number)
            </label>
            <input
              type="text"
              placeholder="e.g. 500"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={budget}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setBudget(e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Location</label>
            <input
              type="text"
              placeholder="e.g. Remote"
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              value={location}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setLocation(e.target.value)
              }
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-md bg-black text-white text-sm px-5 py-2 hover:bg-slate-800"
          >
            Search
          </button>
        </div>
      </section>

      {loading && <p className="text-sm text-slate-500">Loading internships…</p>}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!loading && hasSearched && internships.length === 0 && !error && (
        <p className="text-sm text-slate-500">
          No internships found for this search.
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
              <button
                className="rounded-full bg-black text-white text-xs px-4 py-1.5 hover:bg-slate-800"
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
    </div>
  );
};

export default AdvancedSearchPage;
