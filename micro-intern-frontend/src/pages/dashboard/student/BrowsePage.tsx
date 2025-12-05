import { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";

interface Job {
  _id: string;
  title: string;
  employer: string;
}

const BrowsePage = () => {

  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const data = await apiGet("/internships");
    setJobs(data.data); // backend sends { success, data }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Browse Micro-Internships</h1>

      <div className="grid grid-cols-1 gap-4">
        {jobs.map((job) => (
          <div key={job._id} className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold">{job.title}</h2>
            <p className="text-sm text-gray-500">{job.employer}</p>
            <button className="mt-2 px-3 py-1 text-sm rounded-full bg-black text-white">
              View details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowsePage;
