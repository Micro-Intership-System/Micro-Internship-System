type ApiErrorBody = { message?: string };

function getToken(): string | null {
  const token = localStorage.getItem("mi_token");
  // Trim whitespace if token exists
  return token ? token.trim() : null;
}

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

async function parseJsonSafe<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // If backend returned HTML, show first part to help debugging.
    throw new Error(text.slice(0, 120));
  }
}

// Use environment variable if set, otherwise use relative path (for Vercel proxy)
const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: buildHeaders() });
  const body = await parseJsonSafe<T | ApiErrorBody>(res);
  if (!res.ok) throw new Error((body as ApiErrorBody).message ?? "Request failed");
  return body as T;
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  const body = await parseJsonSafe<T | ApiErrorBody>(res);
  if (!res.ok) throw new Error((body as ApiErrorBody).message ?? "Request failed");
  return body as T;
}

export async function apiPut<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify(data),
  });
  const body = await parseJsonSafe<T | ApiErrorBody>(res);
  if (!res.ok) throw new Error((body as ApiErrorBody).message ?? "Request failed");
  return body as T;
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

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  const body = await parseJsonSafe<T | ApiErrorBody>(res);
  if (!res.ok) throw new Error((body as ApiErrorBody).message ?? "Request failed");
  return body as T;
}
