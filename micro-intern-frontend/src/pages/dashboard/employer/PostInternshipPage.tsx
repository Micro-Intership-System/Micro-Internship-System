import { useState } from "react";
import { createInternship } from "../../../api/internships";

const PostInternshipPage = () => {
  const [form, setForm] = useState({
    title: "",
    employer: "",
    location: "",
    duration: "",
    budget: "",
    skills: "",
    tags: "",
    bannerUrl: "",
    description: "",
    isFeatured: false,
  });

  function update(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function submit(e: { preventDefault: () => void; }) {
    e.preventDefault();
    const payload = {
      ...form,
      skills: form.skills.split(",").map(s => s.trim()),
      tags: form.tags.split(",").map(t => t.trim()),
      budget: Number(form.budget),
    };

    await createInternship(payload);
    alert("Internship posted!");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Post a New Internship</h1>

      <form onSubmit={submit} className="space-y-4 max-w-xl">
        <input
          placeholder="Title"
          className="border p-2 w-full"
          onChange={e => update("title", e.target.value)}
        />

        <input
          placeholder="Employer"
          className="border p-2 w-full"
          onChange={e => update("employer", e.target.value)}
        />

        <input
          placeholder="Location"
          className="border p-2 w-full"
          onChange={e => update("location", e.target.value)}
        />

        <input
          placeholder="Duration"
          className="border p-2 w-full"
          onChange={e => update("duration", e.target.value)}
        />

        <input
          placeholder="Budget"
          className="border p-2 w-full"
          onChange={e => update("budget", e.target.value)}
        />

        <input
          placeholder="Skills (comma separated)"
          className="border p-2 w-full"
          onChange={e => update("skills", e.target.value)}
        />

        <input
          placeholder="Tags (comma separated)"
          className="border p-2 w-full"
          onChange={e => update("tags", e.target.value)}
        />

        <input
          placeholder="Banner URL"
          className="border p-2 w-full"
          onChange={e => update("bannerUrl", e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="border p-2 w-full"
          rows={4}
          onChange={e => update("description", e.target.value)}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            onChange={e => update("isFeatured", e.target.checked)}
          />
          Featured
        </label>

        <button className="bg-black text-white px-4 py-2 rounded">
          Post Internship
        </button>
      </form>
    </div>
  );
};

export default PostInternshipPage;
