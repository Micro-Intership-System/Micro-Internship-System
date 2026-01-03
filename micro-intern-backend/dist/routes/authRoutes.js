"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const user_1 = require("../models/user");
const emailService_1 = require("../utils/emailService");
const emailTemplates_1 = require("../utils/emailTemplates");
const router = express_1.default.Router();
// POST /api/auth/register
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const exists = await user_1.User.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }
        const hashed = await bcrypt_1.default.hash(password, 10);
        // Generate email verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const verificationTokenExpires = new Date();
        verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24); // 24 hours
        const user = await user_1.User.create({
            name,
            email,
            password: hashed,
            role: role || "student",
            emailVerificationToken: verificationToken,
            emailVerificationTokenExpires: verificationTokenExpires,
            emailVerified: false,
        });
        // Send welcome email and verification email
        try {
            await (0, emailService_1.sendEmail)(user.email, (0, emailTemplates_1.welcomeEmail)(user.name, user.role));
            await (0, emailService_1.sendEmail)(user.email, (0, emailTemplates_1.emailVerificationEmail)(user.name, verificationToken));
        }
        catch (emailError) {
            console.error("Failed to send welcome/verification email:", emailError);
            // Don't fail signup if email fails
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
            }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Signup failed" });
    }
});
// POST /api/auth/login
router.post("/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await user_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        if (role && user.role !== role) {
            return res.status(403).json({ success: false, message: "Role mismatch" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        // Send login notification email for admin accounts
        if (user.role === "admin") {
            try {
                const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "Unknown";
                const ip = Array.isArray(ipAddress) ? ipAddress[0] : (typeof ipAddress === "string" ? ipAddress : "Unknown");
                await (0, emailService_1.sendEmail)(user.email, (0, emailTemplates_1.adminLoginEmail)(user.name, new Date(), ip));
            }
            catch (emailError) {
                console.error("Failed to send admin login email:", emailError);
                // Don't fail login if email fails
            }
        }
        // Build user response with role-specific fields
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        // Include gamification fields for students
        if (user.role === "student") {
            userResponse.gold = user.gold || 0;
            userResponse.xp = user.xp || 0;
            userResponse.starRating = user.starRating || 1;
            userResponse.totalTasksCompleted = user.totalTasksCompleted || 0;
            userResponse.averageCompletionTime = user.averageCompletionTime || 0;
            userResponse.institution = user.institution;
            userResponse.skills = user.skills || [];
            userResponse.bio = user.bio;
            userResponse.profilePicture = user.profilePicture;
        }
        res.json({
            success: true,
            token,
            user: userResponse
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Login failed" });
    }
});
router.get("/me", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token)
            return res.status(401).json({ success: false });
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded)
            return res.status(401).json({ success: false });
        const user = await user_1.User.findById(decoded.userId).select("-password");
        res.json({ success: true, user });
    }
    catch {
        res.status(401).json({ success: false });
    }
});
/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        const user = await user_1.User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists for security
            return res.json({
                success: true,
                message: "If an account with that email exists, a password reset link has been sent.",
            });
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const resetTokenExpires = new Date();
        resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour expiry
        user.passwordResetToken = resetToken;
        user.passwordResetTokenExpires = resetTokenExpires;
        await user.save();
        // Send password reset email
        try {
            await (0, emailService_1.sendEmail)(user.email, (0, emailTemplates_1.passwordResetEmail)(user.name, resetToken));
        }
        catch (emailError) {
            console.error("Failed to send password reset email:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send password reset email",
            });
        }
        res.json({
            success: true,
            message: "If an account with that email exists, a password reset link has been sent.",
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to process password reset request" });
    }
});
/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post("/reset-password", async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: "Token and password are required",
            });
        }
        const user = await user_1.User.findOne({
            passwordResetToken: token,
            passwordResetTokenExpires: { $gt: new Date() }, // Token not expired
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }
        // Hash new password
        const hashed = await bcrypt_1.default.hash(password, 10);
        // Update password and clear reset token
        user.password = hashed;
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save();
        res.json({
            success: true,
            message: "Password has been reset successfully",
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to reset password" });
    }
});
/**
 * GET /api/auth/verify-email
 * Verify email with token
 */
router.get("/verify-email", async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Verification token is required",
            });
        }
        const user = await user_1.User.findOne({
            emailVerificationToken: token,
            emailVerificationTokenExpires: { $gt: new Date() }, // Token not expired
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token",
            });
        }
        // Mark email as verified and clear token
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationTokenExpires = undefined;
        await user.save();
        res.json({
            success: true,
            message: "Email verified successfully",
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to verify email" });
    }
});
/**
 * POST /api/auth/resend-verification
 * Resend email verification
 */
router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        const user = await user_1.User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.emailVerified) {
            return res.json({
                success: true,
                message: "Email is already verified",
            });
        }
        // Generate new verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const verificationTokenExpires = new Date();
        verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);
        user.emailVerificationToken = verificationToken;
        user.emailVerificationTokenExpires = verificationTokenExpires;
        await user.save();
        // Send verification email
        try {
            await (0, emailService_1.sendEmail)(user.email, (0, emailTemplates_1.emailVerificationEmail)(user.name, verificationToken));
        }
        catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send verification email",
            });
        }
        res.json({
            success: true,
            message: "Verification email sent successfully",
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to resend verification email" });
    }
});
exports.default = router;
