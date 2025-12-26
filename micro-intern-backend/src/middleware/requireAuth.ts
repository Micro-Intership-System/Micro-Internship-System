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
    
    // Debug logging for upload requests
    if (req.path?.includes("/upload")) {
      console.log("Auth middleware - Upload request:", {
        hasAuthHeader: !!authHeader,
        authHeaderStart: authHeader?.substring(0, 20),
        contentType: req.headers["content-type"],
        method: req.method,
      });
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    let token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Trim whitespace and newlines from token
    token = token.trim();

    // Validate token format before attempting to verify
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      console.error("Invalid JWT token format - expected 3 parts, got:", tokenParts.length, "Token preview:", token.substring(0, 50));
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
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
      console.error("JWT verification error:", err.message);
      return res.status(401).json({
        success: false,
        message: `Invalid token: ${err.message}`,
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

