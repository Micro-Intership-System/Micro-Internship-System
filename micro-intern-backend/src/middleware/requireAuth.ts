import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

function isJwtPayload(v: unknown): v is JwtPayload {
  return (
    typeof v === "object" &&
    v !== null &&
    "userId" in v &&
    typeof (v as any).userId === "string"
  );
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown;

    if (!isJwtPayload(decoded)) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Attach user info to request
    (req as any).user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    console.error("Auth middleware error:", err);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
}

