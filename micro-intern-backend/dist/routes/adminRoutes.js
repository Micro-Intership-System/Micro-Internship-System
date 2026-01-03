"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const user_1 = require("../models/user");
const internship_1 = require("../models/internship");
const router = (0, express_1.Router)();
/**
 * POST /api/admin/fix-user-roles
 * Fix user roles to match their actual role in database (admin only)
 */
router.post("/fix-user-roles", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin only" });
        }
        // Get all users and ensure they have valid roles
        const users = await user_1.User.find({});
        let fixed = 0;
        const issues = [];
        for (const user of users) {
            let needsFix = false;
            const oldRole = user.role;
            let newRole = user.role;
            // Check if role is missing or invalid
            if (!user.role || !["student", "employer", "admin"].includes(user.role)) {
                needsFix = true;
                // Try to determine role from other fields
                const hasEmployerFields = !!(user.companyName || user.companyWebsite || user.companyDescription || user.companyLogo || user.isVerified);
                // Check if user has posted any jobs
                const jobCount = await internship_1.Internship.countDocuments({ postedBy: user._id });
                if (hasEmployerFields || jobCount > 0) {
                    newRole = "employer";
                }
                else {
                    newRole = "student";
                }
            }
            // Also check if role doesn't match the data
            else {
                const hasEmployerFields = !!(user.companyName || user.companyWebsite || user.companyDescription || user.companyLogo || user.isVerified);
                const jobCount = await internship_1.Internship.countDocuments({ postedBy: user._id });
                // If user has employer fields or has posted jobs but role is not employer
                if ((hasEmployerFields || jobCount > 0) && user.role !== "employer") {
                    needsFix = true;
                    newRole = "employer";
                }
                // If user has student fields (institution, skills) but no employer fields and role is employer
                else if ((user.institution || (user.skills && user.skills.length > 0)) && !hasEmployerFields && jobCount === 0 && user.role === "employer") {
                    needsFix = true;
                    newRole = "student";
                }
            }
            if (needsFix) {
                user.role = newRole;
                await user.save();
                fixed++;
                issues.push(`User ${user.email}: Changed role from "${oldRole || "none"}" to "${newRole}"`);
            }
        }
        res.json({
            success: true,
            message: `Fixed ${fixed} user(s)`,
            fixed,
            issues,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fix user roles" });
    }
});
/**
 * DELETE /api/admin/jobs/:id
 * Delete a job (admin only)
 */
router.delete("/jobs/:id", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin only" });
        }
        const { Internship } = await Promise.resolve().then(() => __importStar(require("../models/internship")));
        const { Application } = await Promise.resolve().then(() => __importStar(require("../models/application")));
        const { Payment } = await Promise.resolve().then(() => __importStar(require("../models/payment")));
        const { TaskChatMessage } = await Promise.resolve().then(() => __importStar(require("../models/taskChat")));
        const { Anomaly } = await Promise.resolve().then(() => __importStar(require("../models/anomaly")));
        const job = await Internship.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        // Delete related data
        await Application.deleteMany({ internshipId: job._id });
        await Payment.deleteMany({ taskId: job._id });
        await TaskChatMessage.deleteMany({ taskId: job._id });
        await Anomaly.deleteMany({ taskId: job._id });
        // Delete the job
        await Internship.findByIdAndDelete(job._id);
        res.json({ success: true, message: "Job deleted successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to delete job" });
    }
});
/**
 * DELETE /api/admin/users/:id
 * Delete a user (student or employer) (admin only)
 */
router.delete("/users/:id", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin only" });
        }
        const { User } = await Promise.resolve().then(() => __importStar(require("../models/user")));
        const { Internship } = await Promise.resolve().then(() => __importStar(require("../models/internship")));
        const { Application } = await Promise.resolve().then(() => __importStar(require("../models/application")));
        const { Payment } = await Promise.resolve().then(() => __importStar(require("../models/payment")));
        const { TaskChatMessage } = await Promise.resolve().then(() => __importStar(require("../models/taskChat")));
        const { Anomaly } = await Promise.resolve().then(() => __importStar(require("../models/anomaly")));
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Prevent deleting admin users
        if (user.role === "admin") {
            return res.status(403).json({ success: false, message: "Cannot delete admin users" });
        }
        // Delete related data based on role
        if (user.role === "employer") {
            // Delete employer's jobs and related data
            const jobs = await Internship.find({ employerId: user._id });
            for (const job of jobs) {
                await Application.deleteMany({ internshipId: job._id });
                await Payment.deleteMany({ taskId: job._id });
                await TaskChatMessage.deleteMany({ taskId: job._id });
                await Anomaly.deleteMany({ taskId: job._id });
            }
            await Internship.deleteMany({ employerId: user._id });
        }
        else if (user.role === "student") {
            // Delete student's applications
            await Application.deleteMany({ studentId: user._id });
            // Update jobs where student was accepted
            await Internship.updateMany({ acceptedStudentId: user._id }, { $unset: { acceptedStudentId: "" }, status: "posted" });
        }
        // Delete user's chat messages
        await TaskChatMessage.deleteMany({ senderId: user._id });
        // Delete anomalies related to user
        await Anomaly.deleteMany({ $or: [{ userId: user._id }, { employerId: user._id }] });
        // Delete the user
        await User.findByIdAndDelete(user._id);
        res.json({ success: true, message: "User deleted successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
});
exports.default = router;
