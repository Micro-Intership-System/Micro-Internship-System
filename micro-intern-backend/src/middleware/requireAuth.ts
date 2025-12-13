import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = {
  userId?: string;
  id?: string;
  role?: "student" | "employer" | "admin";
};

function isJwtPayload(v: unknown): v is JwtPayload {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  const roleOk =
    o.role === "student" || o.role === "employer" || o.role === "admin" || o.role === undefined;
  const idOk =
    typeof o.userId === "string" || typeof o.id === "string";
  return roleOk && idOk;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing token" });
  }

  const token = header.slice("Bearer ".length).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ success: false, message: "JWT_SECRET not set" });
  }

  try {
    const decoded: unknown = jwt.verify(token, secret);
    if (!isJwtPayload(decoded)) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const id = decoded.id ?? decoded.userId;
    const role = decoded.role;

    if (!id || !role) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    req.user = { id, role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}
