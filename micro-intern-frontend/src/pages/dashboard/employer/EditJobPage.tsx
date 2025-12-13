import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPut } from "../../../api/client";

type Priority = "high" | "medium" | "low";

type Internship = {
  _id: string;
  title: string;
  location: string;
  duration: string;
  budget: number;
  description: string;
  priorityLevel: Priority;
  updatedAt?: string;
};

type InternshipUpdate = Pick<
  Internship,
  "title" | "location" | "duration" | "budget" | "description" | "priorityLevel"
>;

const emptyForm: InternshipUpdate = {
  title: "",
  location: "",
  duration: "",
  budget: 0,
  description: "",
  priorityLevel: "medium",
};

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<InternshipUpdate>(emptyForm);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // backend returns: { success: true, data: internship }
        const res = await apiGet(`/internships/${id}`);

        const job = res?.data as Internship | undefined;
        if (!job) throw new Error("Internship not found");

        if (!mounted) return;

        setForm({
          title: job.title ?? "",
          location: job.location ?? "",
          duration: job.duration ?? "",
          budget: Number(job.budget ?? 0),
          description: job.description ?? "",
          priorityLevel: (job.priorityLevel ?? "medium") as Priority,
        });
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load job");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  function update<K extends keyof InternshipUpdate>(key: K, value: InternshipUpdate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;

    try {
      setSaving(true);
      setError(null);

      await apiPut(`/internships/${id}`, form);

      navigate("/dashboard/employer/jobs");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">Edit Job</h1>

      <input
        className="border p-2 w-full"
        value={form.title}
        onChange={(e) => update("title", e.target.value)}
        placeholder="Title"
        required
      />

      <input
        className="border p-2 w-full"
        value={form.location}
        onChange={(e) => update("location", e.target.value)}
        placeholder="Location"
        required
      />

      <input
        className="border p-2 w-full"
        value={form.duration}
        onChange={(e) => update("duration", e.target.value)}
        placeholder="Duration"
        required
      />

      <input
        className="border p-2 w-full"
        type="number"
        value={form.budget}
        onChange={(e) => update("budget", Number(e.target.value))}
        placeholder="Budget"
        min={0}
        required
      />

      <select
        className="border p-2 w-full"
        value={form.priorityLevel}
        onChange={(e) => update("priorityLevel", e.target.value as Priority)}
      >
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <textarea
        className="border p-2 w-full"
        value={form.description}
        onChange={(e) => update("description", e.target.value)}
        placeholder="Description"
        rows={6}
        required
      />

      <button
        disabled={saving}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
