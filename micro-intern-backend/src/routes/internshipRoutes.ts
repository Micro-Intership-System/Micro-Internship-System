import { Router } from "express";
import { Internship } from "../models/internship";
import { Application } from "../models/application";
import { requireAuth } from "../middleware/requireAuth";
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
 * F2-1: Get Internship Details
 * GET /api/internships/:id
 * Used on the Internship Details Page main content.
 */
router.get("/:id", async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res
        .status(404)
        .json({ success: false, message: "Internship not found" });
    }

    res.json({ success: true, data: internship });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ success: false, message: "Invalid internship ID format" });
  }
});

/**
 * F2-2: Get Related Internships
 * GET /api/internships/:id/related
 * Used in the "Related job posts" section at the bottom of the page.
 */
router.get("/:id/related", async (req, res) => {
  try {
    const base = await Internship.findById(req.params.id);
    if (!base) {
      return res
        .status(404)
        .json({ success: false, message: "Internship not found" });
    }

    const related = await Internship.find({
      _id: { $ne: base._id },
      tags: { $in: base.tags }
    }).limit(3);

    res.json({ success: true, data: related });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ success: false, message: "Invalid internship ID format" });
  }
});

/**
 * POST /api/internships
 * ✅ STEP 5: must be employer + must have company profile + attach employerId + companyName
 */
router.post("/", requireAuth, requireEmployer, async (req, res) => {
  try {
    // 1. Get employer from token
    const employer = await User.findById(req.user!.id);
    if (!employer || !employer.companyName) {
      return res.status(400).json({
        success: false,
        message: "Employer company profile required",
      });
    }

    // 2. Whitelist allowed fields ONLY
    const {
      title,
      location,
      duration,
      budget,
      description,
      skills,
      tags,
      bannerUrl,
      priorityLevel,
      isFeatured,
      deadline,
    } = req.body;

    // 3. Create internship (companyName + employerId injected)
    const internship = await Internship.create({
      title,
      location,
      duration,
      budget,
      description,
      skills,
      tags,
      bannerUrl,
      priorityLevel,
      isFeatured,
      deadline,

      employerId: employer._id,
      companyName: employer.companyName,
    });

    return res.status(201).json({ success: true, data: internship });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      message: "Failed to create internship",
    });
  }
});

/**
 * PUT /api/internships/:id
 * employer can edit ONLY their own post
 */
router.put("/:id", requireAuth, requireEmployer, async (req, res) => {
  try {
    const allowed = [
      "title",
      "location",
      "duration",
      "budget",
      "description",
      "priorityLevel",
      "skills",
      "tags",
      "bannerUrl",
      "isFeatured",
      "deadline",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await Internship.findOneAndUpdate(
      { _id: req.params.id, employerId: req.user!.id }, // ownership check
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Internship not found",
      });
    }

    // updatedAt auto-changes here
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      message: "Failed to update internship",
    });
  }
});

/**
 * DEBUG / helper: list all internships
 * GET /api/internships
 * Lets us see exactly what IDs the backend can find.
 */
router.get("/", async (req, res) => {
  try {
    const items = await Internship.find();
    res.json({ success: true, data: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * F2-3: Apply for Internship
 * POST /api/internships/:id/apply
 * Triggered by "Apply Now" button on details page.
 * NOTE: This is kept for backward compatibility, but the main application flow
 * is now handled in /api/applications
 */
router.post("/:id/apply", async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) {
      return res
        .status(404)
        .json({ success: false, message: "Internship not found" });
    }

    const application = await Application.create({
      internshipId: internship._id,
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
      cvUrl: req.body.cvUrl
    });

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .json({ success: false, message: "Invalid application data" });
  }
});

/**
 * F2-4: Save Internship (Save for later)
 * POST /api/internships/:id/save
 * For now we just return a success JSON; a Saved model can be added later.
 */
router.post("/:id/save", async (req, res) => {
  res.status(201).json({
    success: true,
    saved: true,
    internshipId: req.params.id,
    userId: req.body?.userId ?? "demo-user"
  });
});

export default router;
