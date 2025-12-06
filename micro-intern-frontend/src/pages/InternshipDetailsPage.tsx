import React from "react";

const InternshipDetailsPage: React.FC = () => {
  // later you can replace this with real data from /internships/:id
  const internship = {
    title: "UX Research Assistant — 3-Week Remote Internship",
    employer: "Nyancom Ltd.",
    deadline: "Application Deadline: 29 Nov 2025",
    location: "Remote (Bangladesh)",
    duration: "3 Weeks",
    budget: "4,000 BDT",
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top nav */}
      <header className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-4 px-4">
          <span className="text-sm font-semibold tracking-tight">
            Micro Internship
          </span>

          <nav className="flex items-center gap-6 text-xs md:text-sm text-slate-600">
            <button className="hover:text-black">Home</button>
            <button className="hover:text-black">About</button>
            <button className="hover:text-black">Browse Jobs</button>
            <button className="hover:text-black">Post Jobs</button>
            <button className="hover:text-black">How It Works</button>

            <button className="text-xs rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100">
              Log In
            </button>
            <button className="text-xs rounded-full bg-black text-white px-3 py-1 hover:bg-slate-800">
              Sign Up
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
          {/* Title */}
          <section>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
              {internship.title}
            </h1>
            <p className="mt-2 text-xs md:text-sm text-slate-500">
              Posted by <span className="font-medium">{internship.employer}</span> ·{" "}
              {internship.deadline}
            </p>

            {/* Hero image */}
            <img
              src="/images/internships/ux-banner.png"
              alt="UX internship banner"
              className="mt-6 w-full rounded-lg object-cover"
              style={{ aspectRatio: "16 / 9" }}
            />
          </section>

          {/* Project overview */}
          <section className="mt-8 text-center">
            <h2 className="text-sm font-semibold tracking-tight">
              Project Overview
            </h2>
            <p className="mt-3 text-xs md:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Assist the UX research team in analyzing user feedback and organizing usability
              testing results for a new mobile and web dashboard.
            </p>

            <div className="mt-4 text-xs md:text-sm text-slate-600 space-y-1 leading-relaxed">
              <p>
                <span className="font-semibold">Key responsibilities:</span>
              </p>
              <ul className="list-disc list-inside text-left inline-block text-slate-600">
                <li>Support usability test planning and note taking.</li>
                <li>Summarize insights from session recordings and survey data.</li>
                <li>Help maintain research repository in Google Sheets.</li>
              </ul>
            </div>

            <div className="mt-4 text-xs md:text-sm text-slate-600">
              <p>
                <span className="font-semibold">Duration &amp; Payment:</span> {internship.duration} ·{" "}
                {internship.budget} · {internship.location}
              </p>
            </div>

            <button className="mt-6 inline-flex items-center justify-center rounded-full bg-black text-white text-xs md:text-sm px-5 py-2 hover:bg-slate-800">
              Chat now
            </button>
          </section>

          {/* Mid images strip */}
          <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <img
              src="/images/internships/ux-photo-1.jpg"
              alt="UX research work"
              className="w-full rounded-lg object-cover"
            />
            <img
              src="/images/internships/ux-photo-2.jpg"
              alt="UX collaboration"
              className="w-full rounded-lg object-cover"
            />
          </section>

          {/* Details / description */}
          <section className="mt-8 text-xs md:text-sm text-slate-600 leading-relaxed space-y-4">
            <p>
              Our remote system ensures clear payment and verifiable task completion.
              Clear progress updates and proper documentation are required throughout
              the project.
            </p>
            <div>
              <p className="font-semibold mb-1">Deliverables</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Summary slide deck of key research findings.</li>
                <li>Organized spreadsheet of interview and usability test notes.</li>
                <li>Short reflection on what you learned from the project.</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Contact &amp; support</p>
              <p>
                Supervisor: <span className="font-medium">Project Coordinator</span>{" "}
                (Nyancom UX team) · support@nyancomux.com
              </p>
            </div>
          </section>

          {/* Apply buttons */}
          <section className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-black text-white text-xs md:text-sm px-5 py-2 hover:bg-slate-800">
              Apply now
            </button>
            <button className="rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-xs md:text-sm px-5 py-2 hover:bg-slate-200">
              Save for later
            </button>
          </section>

          {/* Related job posts */}
          <section className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-sm font-semibold mb-4">Related job posts</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* card 1 */}
              <article className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <img
                  src="/images/internships/related-1.jpg"
                  alt="Content Writer"
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <p className="text-xs font-semibold">
                    Content Writer — Blog Posts
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">Nyancom</p>
                </div>
              </article>

              {/* card 2 */}
              <article className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <img
                  src="/images/internships/related-2.jpg"
                  alt="Photography model"
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <p className="text-xs font-semibold">Photography Model</p>
                  <p className="mt-1 text-[11px] text-slate-500">S. Studio</p>
                </div>
              </article>

              {/* card 3 */}
              <article className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <img
                  src="/images/internships/related-3.jpg"
                  alt="Walking partner"
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <p className="text-xs font-semibold">Walking Partner</p>
                  <p className="mt-1 text-[11px] text-slate-500">Walk With Cats</p>
                </div>
              </article>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-slate-500 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-700 mb-1">Micro Internship</p>
            <p>Helping students gain real-world experience through small, paid projects.</p>
          </div>

          <div className="flex gap-8">
            <div>
              <p className="font-semibold text-slate-700 mb-1">Quick Links</p>
              <ul className="space-y-1">
                <li>Home</li>
                <li>Browse Jobs</li>
                <li>Post Jobs</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-1">Contact Us</p>
              <ul className="space-y-1">
                <li>Email: support@microinternship.com</li>
                <li>Phone: +880 999</li>
                <li>Address: Banana Lane, Merul Badda</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InternshipDetailsPage;
