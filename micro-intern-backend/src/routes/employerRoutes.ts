import { Router } from "express";
import { User } from "../models/user";
import { Internship } from "../models/internship";
import { requireAuth } from "../middleware/requireAuth";
import { Application } from "../models/application";

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
    if (!user || user.role !== "employer") {
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
router.get("/me", requireEmployer, async (req: any, res) => {
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
router.put("/me", requireEmployer, async (req: any, res) => {
  try {
    const allowedFields = [
      "name",
      "companyName",
      "companyWebsite",
      "companyDescription",
      "companyLogo",
    ];

    const updates: any = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
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
router.post("/me/logo", requireEmployer, async (req: any, res) => {
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
router.post("/me/about", requireEmployer, async (req: any, res) => {
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

      res.json({ success: true, data: apps });
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

      const updated = await Application.findByIdAndUpdate(
        appId,
        { status },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      res.json({ success: true, data: updated });
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
