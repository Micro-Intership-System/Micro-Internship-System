const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:1547/api";

export async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function apiPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function apiPatch<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  const body = await parseJsonSafe<T | ApiErrorBody>(res);
  if (!res.ok) throw new Error((body as ApiErrorBody).message ?? "Request failed");
  return body as T;
}