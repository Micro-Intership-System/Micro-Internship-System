import { Router } from "express";
import { Internship } from "../models/internship";
import { Application } from "../models/application";
<<<<<<< Updated upstream
import { User } from "../models/user";
import { requireAuth } from "../middleware/requireAuth";
import { requireEmployer } from "../middleware/requireEmployer";
=======
import { Request, Response } from "express";
import { Internship } from "../models/internship";
>>>>>>> Stashed changes

const router = Router();

/**
 * GET /api/internships  (public)
 */
router.get("/", async (_req, res) => {
  const list = await Internship.find().sort({ createdAt: -1 });
  return res.json({ success: true, data: list });
});

/**
 * GET /api/internships/:id  (public)
 */
router.get("/:id", async (req, res) => {
  const internship = await Internship.findById(req.params.id);
  if (!internship) return res.status(404).json({ success: false, message: "Internship not found" });
  return res.json({ success: true, data: internship });
});

/**
 * GET /api/internships/:id/related (public)
 */
router.get("/:id/related", async (req, res) => {
  const base = await Internship.findById(req.params.id);
  if (!base) return res.status(404).json({ success: false, message: "Internship not found" });

  const related = await Internship.find({
    _id: { $ne: base._id },
    tags: { $in: base.tags },
  }).limit(3);

  return res.json({ success: true, data: related });
});

/**
 * POST /api/internships
 * ✅ STEP 5: must be employer + must have company profile + attach employerId + companyName
 */
router.post("/", requireAuth, requireEmployer, async (req, res) => {
  const employer = await User.findById(req.user!.id).select("-password");
  if (!employer) return res.status(404).json({ success: false, message: "Employer not found" });

  const companyName = (employer.companyName ?? "").trim();
  if (!companyName) {
    return res.status(400).json({
      success: false,
      message: "Complete company profile before posting internships",
    });
  }

  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const location = typeof req.body.location === "string" ? req.body.location.trim() : "";
  const duration = typeof req.body.duration === "string" ? req.body.duration.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";

  const budgetNum = Number(req.body.budget);
  const budget = Number.isFinite(budgetNum) ? budgetNum : -1;

  const priorityRaw = typeof req.body.priorityLevel === "string" ? req.body.priorityLevel : "medium";
  const priorityLevel = priorityRaw === "high" || priorityRaw === "low" ? priorityRaw : "medium";

  const skills = Array.isArray(req.body.skills)
    ? req.body.skills.filter((x: unknown): x is string => typeof x === "string")
    : [];

  const tags = Array.isArray(req.body.tags)
    ? req.body.tags.filter((x: unknown): x is string => typeof x === "string")
    : [];

  const bannerUrl = typeof req.body.bannerUrl === "string" ? req.body.bannerUrl.trim() : "";
  const isFeatured = typeof req.body.isFeatured === "boolean" ? req.body.isFeatured : false;

  if (!title || !location || !duration || !description || budget < 0) {
    return res.status(400).json({ success: false, message: "Invalid payload" });
  }

  const created = await Internship.create({
    title,
    location,
    duration,
    budget,
    description,
    priorityLevel,
    skills,
    tags,
    bannerUrl,
    isFeatured,
    employerId: employer._id,
    companyName,
  });

  return res.status(201).json({ success: true, data: created });
});

/**
 * PUT /api/internships/:id
 * employer can edit ONLY their own post
 */
router.put("/:id", requireAuth, requireEmployer, async (req, res) => {
  const job = await Internship.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: "Internship not found" });

  if (String(job.employerId) !== String(req.user!.id)) {
    return res.status(403).json({ success: false, message: "Not allowed" });
  }

  const allowed = ["title", "location", "duration", "budget", "description", "priorityLevel"] as const;

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      (job as unknown as Record<string, unknown>)[key] = req.body[key];
    }
  }

  await job.save();
  return res.json({ success: true, data: job });
});

/**
 * POST /api/internships/:id/apply
 * (leave as your current flow; this is just kept)
 */
router.post("/:id/apply", async (req, res) => {
  try {
    const application = await Application.create({
      internshipId: req.params.id,
      ...req.body,
    });
    return res.status(201).json({ success: true, data: application });
  } catch {
    return res.status(400).json({ success: false, message: "Apply failed" });
  }
});

<<<<<<< Updated upstream
=======
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

// GET /api/internships/search
router.get("/internships/search", async (req: Request, res: Response) => {
  try {
    const { q, skills, duration, budget, location } = req.query;

    const filter: Record<string, unknown> = {};

    if (typeof q === "string" && q.trim() !== "") {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [{ title: regex }, { employer: regex }, { location: regex }];
    }

    if (typeof skills === "string" && skills.trim() !== "") {
      const skillArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (skillArray.length > 0) {
        filter.skills = { $in: skillArray };
      }
    }

    if (typeof duration === "string" && duration.trim() !== "") {
      filter.duration = duration.trim();
    }

    if (typeof budget === "string" && budget.trim() !== "") {
      const num = Number(budget);
      if (!Number.isNaN(num)) {
        filter.budget = { $lte: num }; // change to $gte if you prefer
      }
    }

    if (typeof location === "string" && location.trim() !== "") {
      filter.location = location.trim();
    }

    const results = await Internship.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to search internships",
    });
  }
});

>>>>>>> Stashed changes
export default router;
