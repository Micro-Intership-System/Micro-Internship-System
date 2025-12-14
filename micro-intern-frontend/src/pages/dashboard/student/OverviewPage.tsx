import React from "react";

const OverviewPage: React.FC = () => {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          Micro-Internships for Students
        </p>
        <h1 className="mt-2 text-2xl md:text-3xl font-semibold">
          Build real experience with small, focused projects.
        </h1>
        <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto">
          Discover short-term, skill-based micro-internships designed for busy
          students. Apply, complete tasks, and collect reviews that actually
          matter.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            className="rounded-full bg-black text-white text-xs md:text-sm px-5 py-2 hover:bg-slate-800"
            onClick={() => {
              window.location.href = "/dashboard/student/browse";
            }}
          >
            Browse jobs
          </button>
          <button
            className="rounded-full bg-white border border-slate-300 text-xs md:text-sm px-5 py-2 hover:bg-slate-100"
            onClick={() => {
              window.location.href = "/dashboard/student/advanced-search";
            }}
          >
            Advanced search
          </button>
        </div>
      </section>
    </div>
  );
};

export default OverviewPage;
