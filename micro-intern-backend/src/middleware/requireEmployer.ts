import type { Request, Response, NextFunction } from "express";

export function requireEmployer(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (req.user.role !== "employer") {
    return res.status(403).json({ success: false, message: "Employer only" });
  }
  next();
}
