import { Router } from "express";
import { Internship } from "../models/internship";
import { Application } from "../models/application";

const router = Router();

/**
 * F2-0 (optional for seeding)
 * POST /api/internships
 * Create an internship (useful for inserting sample data via Postman)
 */
router.post("/", async (req, res) => {
  try {
    const internship = await Internship.create(req.body);
    res.status(201).json({ success: true, data: internship });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Invalid internship data" });
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
