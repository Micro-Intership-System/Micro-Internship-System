import { Router } from "express";
import { User } from "../models/user";
import { Internship } from "../models/internship";
import { requireAuth } from "../middleware/requireAuth";
import { Application } from "../models/application";
import { Anomaly } from "../models/anomaly";
import { createNotification } from "../utils/notifications";

const router = Router();

/**
 * Middleware: require employer role
 */
async function requireEmployer(req: any, res: any, next: any) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Check if JWT token says employer but database doesn't match - auto-fix it
    if (req.user.role === "employer" && user.role !== "employer") {
      console.warn(`Role mismatch for user ${user.email}: JWT says "employer" but DB has "${user.role}". Auto-fixing...`);
      user.role = "employer";
      await user.save();
    }

    // Final check - must be employer in database
    if (user.role !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Access denied — employer account required",
      });
    }

    req.employer = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * GET /api/employer/me
 * Fetch employer profile (from User collection)
 */
router.get("/me", requireAuth, requireEmployer, async (req: any, res) => {
  const employer = req.employer;

  res.json({
    success: true,
    data: {
      id: employer._id,
      name: employer.name,
      email: employer.email,
      companyName: employer.companyName,
      companyWebsite: employer.companyWebsite,
      companyDescription: employer.companyDescription,
      companyLogo: employer.companyLogo,
      createdAt: employer.createdAt,
      updatedAt: employer.updatedAt,
    },
  });
});

/**
 * PUT /api/employer/me
 * Update employer profile fields
 */
router.put("/me", requireAuth, requireEmployer, async (req: any, res) => {
  try {
    const allowedFields = [
      "name",
      "companyName",
      "companyWebsite",
      "companyDescription",
      "companyLogo",
    ];

    const updates: any = {};
    const oldCompanyName = req.employer.companyName;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Track company name changes - if changed more than once, create anomaly
    if (updates.companyName && updates.companyName !== oldCompanyName && oldCompanyName) {
      // Count previous company name changes (check existing anomalies)
      const existingAnomalies = await Anomaly.countDocuments({
        type: "company_name_change",
        employerId: req.employer._id,
        status: { $in: ["open", "investigating"] },
      });

      // If this is the second or more change, create anomaly
      if (existingAnomalies >= 1) {
        await Anomaly.create({
          type: "company_name_change",
          severity: "medium",
          employerId: req.employer._id,
          userId: req.employer._id,
          description: `Employer "${req.employer.name}" (${req.employer.email}) has changed company name multiple times. Previous: "${oldCompanyName}", New: "${updates.companyName}"`,
          detectedAt: new Date(),
        });
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.employer._id,
      updates,
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Invalid update data" });
  }
});

/**
 * POST /api/employer/me/logo
 * Upload or update employer logo (URL only)
 */
router.post("/me/logo", requireAuth, requireEmployer, async (req: any, res) => {
  try {
    if (!req.body.companyLogo) {
      return res.status(400).json({ success: false, message: "Logo URL required" });
    }

    const updated = await User.findByIdAndUpdate(
      req.employer._id,
      { companyLogo: req.body.companyLogo },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * POST /api/employer/me/about
 * Update description only
 */
router.post("/me/about", requireAuth, requireEmployer, async (req: any, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.employer._id,
      { companyDescription: req.body.companyDescription },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Invalid description" });
  }
});

/**
 * GET /api/employer/jobs
 * Get all jobs posted by the employer
 */
router.get("/jobs", requireAuth, requireEmployer, async (req: any, res) => {
  try {
    const jobs = await Internship.find({ employerId: req.user.id }).lean();

    const jobIds = jobs.map(j => j._id);
    const counts = await Application.aggregate([
      { $match: { internshipId: { $in: jobIds } } },
      { $group: { _id: "$internshipId", count: { $sum: 1 } } },
    ]);

    const countMap = Object.fromEntries(
      counts.map(c => [String(c._id), c.count])
    );

    const enriched = jobs.map(j => ({
      ...j,
      applicantsCount: countMap[String(j._id)] || 0,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load jobs" });
  }
});

/**
 * GET /api/employer/jobs/:jobId/applications
 * Employer views applications for a job
 */
router.get(
  "/jobs/:jobId/applications",
  requireAuth,
  requireEmployer,
  async (req: any, res) => {
    try {
      const { jobId } = req.params;

      const apps = await Application.find({ internshipId: jobId })
        .populate(
          "studentId",
          "name email institution skills bio profilePicture portfolio"
        )
        .sort({ createdAt: -1 });

      // For each application, find all previous applications by the same student for this job
      const appsWithHistory = await Promise.all(
        apps.map(async (app) => {
          const allStudentApps = await Application.find({
            internshipId: jobId,
            studentId: app.studentId,
          })
            .sort({ createdAt: -1 })
            .select("status createdAt");

          return {
            ...app.toObject(),
            previousApplications: allStudentApps.filter(
              (a) => a._id.toString() !== app._id.toString()
            ),
          };
        })
      );

      res.json({ success: true, data: appsWithHistory });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to load applications",
      });
    }
  }
);

/**
 * GET /api/employer/all
 * Get all employers (admin only)
 */
router.get("/all", requireAuth, async (req: any, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const employers = await User.find({ role: "employer" })
      .select("name email companyName companyWebsite companyDescription companyLogo gold createdAt")
      .sort({ createdAt: -1 });

    // Enrich with job counts
    const enriched = await Promise.all(
      employers.map(async (employer) => {
        const jobCount = await Internship.countDocuments({ employerId: employer._id });
        return {
          ...employer.toObject(),
          totalTasksPosted: jobCount,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to load employers" });
  }
});

/**
 * PATCH /api/employer/applications/:appId/status
 * Accept or reject an application
 */
router.patch(
  "/applications/:appId/status",
  requireAuth,
  requireEmployer,
  async (req: any, res) => {
    try {
      const { appId } = req.params;
      const { status } = req.body;

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const application = await Application.findById(appId).populate("internshipId");
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      const task = application.internshipId as any;
      if (task.employerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not your job",
        });
      }

      if (status === "accepted") {
        // Check if task is available for acceptance
        if (task.status !== "posted") {
          return res.status(400).json({
            success: false,
            message: "Task is not available for acceptance",
          });
        }

        // Reject all other applications
        await Application.updateMany(
          {
            internshipId: task._id,
            _id: { $ne: application._id },
            status: { $in: ["applied", "evaluating"] },
          },
          { status: "rejected" }
        );

        // Accept this application
        application.status = "accepted";
        await application.save();

        // Update task
        task.status = "in_progress";
        task.acceptedStudentId = application.studentId;
        task.acceptedAt = new Date();
        await task.save();

        // Notify student
        await createNotification(
          application.studentId.toString(),
          "application_accepted",
          "Application Accepted!",
          `Your application for "${task.title}" has been accepted!`,
          task._id.toString(),
          req.user.id
        );
      } else {
        // Reject application
        application.status = "rejected";
        await application.save();

        // Notify student
        await createNotification(
          application.studentId.toString(),
          "application_rejected",
          "Application Update",
          `Your application for "${task.title}" was not selected.`,
          task._id.toString(),
          req.user.id
        );
      }

      res.json({ success: true, data: application });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: "Failed to update status",
      });
    }
  }
);

export default router;
