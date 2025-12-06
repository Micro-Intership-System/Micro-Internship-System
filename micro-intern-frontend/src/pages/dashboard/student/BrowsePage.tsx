import React from "react";

type JobCard = {
  title: string;
  location: string;
  requirements: string;
  experience: string;
  budget: string;
};

const sampleJobs: JobCard[] = [
  {
    title: "Frontend Developer",
    location: "Remote (Bangladesh)",
    requirements: "CSE Student or Graduate",
    experience: "Beginner to Intermediate",
    budget: "3,500 BDT · 2 Weeks",
  },
  {
    title: "Content Writer for Tech Blogs",
    location: "Remote",
    requirements: "Strong English Writing Skill",
    experience: "1 Year",
    budget: "1,500 BDT · 1 Week",
  },
  {
    title: "Data Entry Assistant",
    location: "On-site – Dhaka",
    requirements: "HSC / Undergrad",
    experience: "MS Excel Proficiency",
    budget: "800 BDT · 3 Days",
  },
  {
    title: "Photography Model",
    location: "On-site – Chittagong",
    requirements: "HSC",
    experience: "None",
    budget: "5,500 BDT · 1 Day",
  },
];

const BrowsePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-semibold">Browse Jobs</h1>

      <div className="space-y-4">
        {sampleJobs.map(job => (
          <article
            key={job.title}
            className="border border-slate-200 rounded-lg bg-white px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div className="space-y-1 text-sm">
              <h2 className="font-semibold">{job.title}</h2>
              <p className="text-xs text-slate-500">
                <span className="font-medium">Location:</span> {job.location}
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-medium">Degree/Requirements:</span>{" "}
                {job.requirements}
              </p>
              <p className="text-xs text-slate-500">
                <span className="font-medium">Experience:</span>{" "}
                {job.experience}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <p className="text-xs text-slate-600">{job.budget}</p>
              <button className="rounded-full bg-black text-white text-xs px-4 py-1.5 hover:bg-slate-800">
                Apply Now
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* pager-looking footer like Figma */}
      <div className="flex justify-end mt-4 text-xs text-slate-500 gap-3">
        <button className="hover:text-black">&lt;</button>
        <button className="font-semibold text-black">1</button>
        <button className="hover:text-black">2</button>
        <span>…</span>
        <button className="hover:text-black">next &gt;</button>
      </div>
    </div>
  );
};

export default BrowsePage;
