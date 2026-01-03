"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function isJwtPayload(v) {
    return (typeof v === "object" &&
        v !== null &&
        "userId" in v &&
        typeof v.userId === "string");
}
function requireAuth(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!isJwtPayload(decoded)) {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
        // Attach user info to request
        req.user = {
            id: decoded.userId,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            console.error("JWT verification error:", err.message);
            return res.status(401).json({
                success: false,
                message: `Invalid token: ${err.message}`,
            });
        }
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
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
