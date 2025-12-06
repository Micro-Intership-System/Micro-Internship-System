import React from "react";

const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex-1 space-y-3">
          <h1 className="text-2xl font-semibold">Student Profile</h1>
          <p className="text-sm text-slate-600 max-w-md">
            A personalized space to showcase skills, portfolio, and connect with
            potential employers.
          </p>

          <div className="text-sm space-y-1">
            <p>
              <span className="font-semibold">Name:</span> Frost Icarus
            </p>
            <p>
              <span className="font-semibold">Institution:</span> BRAC
              University
            </p>
          </div>

          <div className="text-sm space-y-2">
            <p className="font-semibold">About</p>
            <p className="text-slate-600">
              Passionate about UI/UX design and front-end development.
              Experienced in building React-based web applications and working
              with REST APIs. Interested in Human–Computer Interaction, usability
              testing, and gamified learning systems.
            </p>
          </div>

          <div className="text-sm space-y-1">
            <p className="font-semibold">Skills:</p>
            <p className="text-slate-600">
              JavaScript (React, Node), HTML/CSS/Tailwind, MongoDB, UI Design
              (Figma), Problem Solving.
            </p>
          </div>
        </div>

        <div className="w-full md:w-56">
          <img
            src="/images/student-profile-cat.jpg"
            alt="Student at desk"
            className="w-full rounded-lg object-cover"
          />
        </div>
      </section>

      {/* Contact form block */}
      <section className="border border-slate-200 rounded-lg bg-white p-4 md:p-6">
        <h2 className="text-sm font-semibold mb-4">Contact me</h2>

        <form className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                First name
              </label>
              <input
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Beluga"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Last name
              </label>
              <input
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Cat"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Email address
            </label>
            <input
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="belugacat@mail.net"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Job description
            </label>
            <textarea
              rows={4}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none"
              placeholder="Please mention the company name and position being offered. Only available for paid internships."
            />
          </div>

          <button className="w-full md:w-auto rounded-full bg-black text-white text-xs md:text-sm px-6 py-2 hover:bg-slate-800">
            Start Chat
          </button>
        </form>
      </section>
    </div>
  );
};

export default ProfilePage;
