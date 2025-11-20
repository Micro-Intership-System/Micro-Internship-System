import { Router } from "express";
import { Internship } from "../models/internship";
import { Review } from "../models/review";

const router = Router();

// GET /api/public/landing/featured
router.get("/landing/featured", async (req, res) => {
  try {
    const featuredInternships = await Internship.find({ isFeatured: true }).limit(6);
    res.json({ success: true, data: featuredInternships });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/public/reviews
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(9);
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/public/reviews
router.post("/reviews", async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Invalid review data" });
  }
});

export default router;
