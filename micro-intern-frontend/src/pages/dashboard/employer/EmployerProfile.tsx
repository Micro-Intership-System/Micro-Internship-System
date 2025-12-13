import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPut } from "../../../api/client";

type Employer = {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  companyWebsite?: string;
  companyDescription?: string;
  companyLogo?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type Mode = "view" | "edit" | "create";

type FormState = {
  name: string;
  companyName: string;
  companyWebsite: string;
  companyDescription: string;
  companyLogo: string;
};

function isNonEmpty(s: string): boolean {
  return s.trim().length > 0;
}

export default function EmployerProfile() {
  const [employer, setEmployer] = useState<Employer | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  const [mode, setMode] = useState<Mode>("view");

  const [form, setForm] = useState<FormState>({
    name: "",
    companyName: "",
    companyWebsite: "",
    companyDescription: "",
    companyLogo: "",
  });

  const companyProfileExists = useMemo(() => {
    return isNonEmpty(form.companyName);
  }, [form.companyName]);

  const companyNameLocked = useMemo(() => {
    // lock if backend already has a companyName set
    return isNonEmpty(employer?.companyName ?? "");
  }, [employer?.companyName]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await apiGet<ApiResponse<Employer>>("/employer/me");

        if (!mounted) return;

        const data = res.data;
        setEmployer(data);

        const nextForm: FormState = {
          name: data.name ?? "",
          companyName: data.companyName ?? "",
          companyWebsite: data.companyWebsite ?? "",
          companyDescription: data.companyDescription ?? "",
          companyLogo: data.companyLogo ?? "",
        };
        setForm(nextForm);

        // decide initial mode
        const exists = isNonEmpty(nextForm.companyName);
        setMode(exists ? "view" : "create");
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!isNonEmpty(form.name)) {
      setError("Name is required.");
      return;
    }

    // create requires companyName
    if (mode === "create" && !isNonEmpty(form.companyName)) {
      setError("Company name is required before posting internships.");
      return;
    }

    try {
      setSaving(true);

      const payload: Partial<FormState> = {
        name: form.name.trim(),
        companyWebsite: form.companyWebsite.trim(),
        companyDescription: form.companyDescription.trim(),
        companyLogo: form.companyLogo.trim(),
      };

      // only allow setting companyName in create mode OR if not already locked
      if (mode === "create" || !companyNameLocked) {
        payload.companyName = form.companyName.trim();
      }

      const res = await apiPut<ApiResponse<Employer>>("/employer/me", payload);
      setEmployer(res.data);

      // keep form in sync with saved data
      setForm({
        name: res.data.name ?? "",
        companyName: res.data.companyName ?? "",
        companyWebsite: res.data.companyWebsite ?? "",
        companyDescription: res.data.companyDescription ?? "",
        companyLogo: res.data.companyLogo ?? "",
      });

      setNotice(mode === "create" ? "Company profile created." : "Profile updated.");
      setMode("view");

      window.setTimeout(() => setNotice(""), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (!employer) return;

    setForm({
      name: employer.name ?? "",
      companyName: employer.companyName ?? "",
      companyWebsite: employer.companyWebsite ?? "",
      companyDescription: employer.companyDescription ?? "",
      companyLogo: employer.companyLogo ?? "",
    });

    setError("");
    setNotice("");
    setMode(isNonEmpty(employer.companyName ?? "") ? "view" : "create");
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-600">Loading company profile…</div>
      </div>
    );
  }

  if (error && !employer) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  // ---------------- VIEW MODE (STATIC) ----------------
  if (mode === "view") {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Company Profile</h1>
            <p className="text-sm text-slate-600">
              Your company information used for job posts.
            </p>
          </div>

          <button
            onClick={() => setMode("edit")}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            Edit profile
          </button>
        </div>

        {notice ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-8 grid gap-8 lg:grid-cols-[1fr_240px] items-start">
            {/* left info */}
            <div className="space-y-5">
              <div>
                <div className="text-xs text-slate-500">Company</div>
                <div className="text-xl font-semibold">{form.companyName}</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-slate-500">Contact name</div>
                  <div className="text-sm text-slate-900">{form.name}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="text-sm text-slate-900">{employer?.email ?? ""}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Website</div>
                <div className="text-sm text-slate-900">
                  {isNonEmpty(form.companyWebsite) ? form.companyWebsite : "—"}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">About</div>
                <div className="text-sm text-slate-900 whitespace-pre-wrap">
                  {isNonEmpty(form.companyDescription) ? form.companyDescription : "—"}
                </div>
              </div>
            </div>

            {/* right logo */}
            <aside className="rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-3">
              <div className="h-32 w-32 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                {isNonEmpty(form.companyLogo) ? (
                  <img
                    src={form.companyLogo}
                    alt="Company logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No logo</span>
                )}
              </div>
              <div className="text-xs text-slate-500 text-center">
                Logo (optional)
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- CREATE / EDIT MODE (FORM) ----------------
  const isCreate = mode === "create";

  return (
    <div className="grid gap-10 lg:grid-cols-2 items-start">
      <section className="space-y-4">
        <div className="space-y-1">
          <div className="text-sm text-slate-600">Employer</div>
          <h1 className="text-4xl font-semibold tracking-tight">
            {isCreate ? "Create your company profile." : "Edit company profile."}
          </h1>
        </div>

        <p className="text-slate-600 max-w-prose">
          {isCreate
            ? "You must complete this before posting internships."
            : "Update your company details. These are shown on your job posts."}
        </p>

        {!isCreate && companyNameLocked ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Company name is locked after first setup.
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">
              {isCreate ? "Company details" : "Update details"}
            </h2>
            <p className="text-sm text-slate-600">
              {isCreate ? "Create once, then post internships." : "Save changes when you're done."}
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          ) : null}

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Contact name</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Email</label>
              <input
                value={employer?.email ?? ""}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Company name</label>
              <input
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 disabled:bg-slate-100"
                required={isCreate}
                disabled={!isCreate && companyNameLocked}
                placeholder="Required before posting internships"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Company website</label>
              <input
                value={form.companyWebsite}
                onChange={(e) => update("companyWebsite", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">About</label>
              <textarea
                value={form.companyDescription}
                onChange={(e) => update("companyDescription", e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="What does your company do?"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-900">Logo URL (optional)</label>
              <input
                value={form.companyLogo}
                onChange={(e) => update("companyLogo", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
              >
                {saving ? "Saving…" : isCreate ? "Create profile" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
