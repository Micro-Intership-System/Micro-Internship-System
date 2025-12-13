export type Role = "student" | "employer" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
