import { Router } from "express";
import { User } from "../models/user";

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

export default router;
