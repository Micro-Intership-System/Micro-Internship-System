import { Router } from "express";
import { User } from "../models/user";
import { Internship } from "../models/internship";
import { requireAuth } from "../middleware/requireAuth";
import { requireEmployer } from "../middleware/requireEmployer";

const router = Router();

/**
 * GET /api/employer/me
 */
router.get("/me", requireAuth, requireEmployer, async (req, res) => {
  const employer = await User.findById(req.user!.id).select("-password");
  if (!employer) {
    return res.status(404).json({ success: false, message: "Employer not found" });
  }

  return res.json({
    success: true,
    data: {
      id: employer._id,
      name: employer.name,
      email: employer.email,
      companyName: employer.companyName,
      companyWebsite: employer.companyWebsite,
      companyDescription: employer.companyDescription,
      companyLogo: employer.companyLogo,
      // createdAt: employer.createdAt,
      // updatedAt: employer.updatedAt,
    },
  });
});

/**
 * PUT /api/employer/me
 */
router.put("/me", requireAuth, requireEmployer, async (req, res) => {
  try {
    const allowedFields: Array<
      "name" | "companyName" | "companyWebsite" | "companyDescription" | "companyLogo"
    > = ["name", "companyName", "companyWebsite", "companyDescription", "companyLogo"];

    const updates: Partial<Record<(typeof allowedFields)[number], unknown>> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const updated = await User.findByIdAndUpdate(req.user!.id, updates, { new: true }).select(
      "-password"
    );

    return res.json({ success: true, data: updated });
  } catch {
    return res.status(400).json({ success: false, message: "Invalid update data" });
  }
});

/**
 * GET /api/employer/jobs
 * employer's own job posts
 */
router.get("/jobs", requireAuth, requireEmployer, async (req, res) => {
  const jobs = await Internship.find({ employerId: req.user!.id }).sort({ updatedAt: -1 });
  return res.json({ success: true, data: jobs });
});

export default router;
