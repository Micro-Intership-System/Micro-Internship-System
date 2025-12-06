import { apiGet, apiPost } from "./client";

export function createInternship(data: Record<string, unknown>) {
  return apiPost("/internships", data);
}

export function getAllInternships() {
  return apiGet("/internships");
}

export function getInternship(id: string) {
  return apiGet(`/internships/${id}`);
}
