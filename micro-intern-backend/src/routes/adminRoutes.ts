import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { User } from "../models/user";
import { Internship } from "../models/internship";

const router = Router();

/**
 * POST /api/admin/fix-user-roles
 * Fix user roles to match their actual role in database (admin only)
 */
router.post("/fix-user-roles", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    // Get all users and ensure they have valid roles
    const users = await User.find({});
    let fixed = 0;
    const issues: string[] = [];

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
        const jobCount = await Internship.countDocuments({ postedBy: user._id });
        
        if (hasEmployerFields || jobCount > 0) {
          newRole = "employer";
        } else {
          newRole = "student";
        }
      }
      // Also check if role doesn't match the data
      else {
        const hasEmployerFields = !!(user.companyName || user.companyWebsite || user.companyDescription || user.companyLogo || user.isVerified);
        const jobCount = await Internship.countDocuments({ postedBy: user._id });
        
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
        user.role = newRole as any;
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fix user roles" });
  }
});

/**
 * DELETE /api/admin/jobs/:id
 * Delete a job (admin only)
 */
router.delete("/jobs/:id", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const { Internship } = await import("../models/internship");
    const { Application } = await import("../models/application");
    const { Payment } = await import("../models/payment");
    const { TaskChatMessage } = await import("../models/taskChat");
    const { Anomaly } = await import("../models/anomaly");

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (student or employer) (admin only)
 */
router.delete("/users/:id", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const { User } = await import("../models/user");
    const { Internship } = await import("../models/internship");
    const { Application } = await import("../models/application");
    const { Payment } = await import("../models/payment");
    const { TaskChatMessage } = await import("../models/taskChat");
    const { Anomaly } = await import("../models/anomaly");

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
    } else if (user.role === "student") {
      // Delete student's applications
      await Application.deleteMany({ studentId: user._id });
      // Update jobs where student was accepted
      await Internship.updateMany(
        { acceptedStudentId: user._id },
        { $unset: { acceptedStudentId: "" }, status: "posted" }
      );
    }

    // Delete user's chat messages
    await TaskChatMessage.deleteMany({ senderId: user._id });
    // Delete anomalies related to user
    await Anomaly.deleteMany({ $or: [{ userId: user._id }, { employerId: user._id }] });

    // Delete the user
    await User.findByIdAndDelete(user._id);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

export default router;

