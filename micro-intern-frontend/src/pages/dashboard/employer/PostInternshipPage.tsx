import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../../../api/client";
import { createInternship } from "../../../api/internships";

type Priority = "high" | "medium" | "low";

type EmployerMe = {
  id: string;
  companyName?: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type FormState = {
  title: string;
  location: string;
  duration: string;
  budget: string;
  skills: string;
  tags: string;
  bannerUrl: string;
  description: string;
  priorityLevel: Priority;
  isFeatured: boolean;
};

function splitCsv(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function PostInternshipPage() {
  const navigate = useNavigate();

  const [checkingProfile, setCheckingProfile] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    title: "",
    location: "",
    duration: "",
    budget: "",
    skills: "",
    tags: "",
    bannerUrl: "",
    description: "",
    priorityLevel: "medium",
    isFeatured: false,
  });

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        setCheckingProfile(true);
        setError("");

        // IMPORTANT: use apiGet so base URL / auth stays consistent
        const res = await apiGet<ApiResponse<EmployerMe>>("/employer/me");
        const cn = (res?.data?.companyName ?? "").trim();

        if (!cn) {
          navigate("/dashboard/employer/profile", { replace: true });
          return;
        }

        if (!mounted) return;
        setCompanyName(cn);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to verify employer profile");
      } finally {
        if (mounted) setCheckingProfile(false);
      }
    }

    check();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const parsedPreview = useMemo(() => {
    return { skills: splitCsv(form.skills), tags: splitCsv(form.tags) };
  }, [form.skills, form.tags]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!companyName) {
      navigate("/dashboard/employer/profile", { replace: true });
      return;
    }

    const budgetNum = Number(form.budget);
    if (!Number.isFinite(budgetNum) || budgetNum < 0) {
      setError("Budget must be a valid non-negative number.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      location: form.location.trim(),
      duration: form.duration.trim(),
      budget: budgetNum,
      skills: splitCsv(form.skills),
      tags: splitCsv(form.tags),
      bannerUrl: form.bannerUrl.trim(),
      description: form.description.trim(),
      priorityLevel: form.priorityLevel,
      isFeatured: form.isFeatured,
      companyName, // store employerId + companyName in backend
    };

    try {
      setSubmitting(true);
      await createInternship(payload);
      navigate("/dashboard/employer/jobs");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to post internship");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-slate-600">Checking company profile…</div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 items-start">
      <section className="space-y-4">
        <div className="space-y-1">
          <div className="text-sm text-slate-600">Employer</div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Post a micro-internship.
          </h1>
        </div>

        <p className="text-slate-600 max-w-prose">
          This internship will be published under{" "}
          <span className="font-medium text-slate-900">{companyName}</span>.
        </p>

        <ul className="text-slate-700 space-y-2">
          <li>✓ Priority helps you get emergency attention.</li>
          <li>✓ Skills & tags improve matching.</li>
          <li>✓ Banner is optional.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Create internship</h2>
            <p className="text-sm text-slate-600">
              Fill the details below and publish to students.
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Title</label>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="e.g., Build a simple landing page in React"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-900">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                  placeholder="Remote / On-site / Hybrid"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-900">Duration</label>
                <input
                  value={form.duration}
                  onChange={(e) => update("duration", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                  placeholder="e.g., 1 week"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-900">Budget</label>
                <input
                  value={form.budget}
                  onChange={(e) => update("budget", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                  placeholder="e.g., 5000"
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-900">Priority</label>
                <select
                  value={form.priorityLevel}
                  onChange={(e) => update("priorityLevel", e.target.value as Priority)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Skills</label>
              <input
                value={form.skills}
                onChange={(e) => update("skills", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="e.g., React, TypeScript, Tailwind"
              />
              <p className="text-xs text-slate-500">
                Parsed: {parsedPreview.skills.length ? parsedPreview.skills.join(", ") : "—"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Tags</label>
              <input
                value={form.tags}
                onChange={(e) => update("tags", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="e.g., frontend, ui, quick-task"
              />
              <p className="text-xs text-slate-500">
                Parsed: {parsedPreview.tags.length ? parsedPreview.tags.join(", ") : "—"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Banner URL (optional)</label>
              <input
                value={form.bannerUrl}
                onChange={(e) => update("bannerUrl", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="Scope, deliverables, success criteria."
                required
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => update("isFeatured", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Feature this post
            </label>

            <button
              disabled={submitting}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Publish internship"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
