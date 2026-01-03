"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const internship_1 = require("../models/internship");
const review_1 = require("../models/review");
const router = (0, express_1.Router)();
// GET /api/public/landing/featured
router.get("/landing/featured", async (req, res) => {
    try {
        const featuredInternships = await internship_1.Internship.find({ isFeatured: true }).limit(6);
        res.json({ success: true, data: featuredInternships });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
// GET /api/public/reviews
router.get("/reviews", async (req, res) => {
    try {
        const reviews = await review_1.Review.find().sort({ createdAt: -1 }).limit(9);
        res.json({ success: true, data: reviews });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
// POST /api/public/reviews
router.post("/reviews", async (req, res) => {
    try {
        const review = await review_1.Review.create(req.body);
        res.status(201).json({ success: true, data: review });
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: "Invalid review data" });
    }
});
exports.default = router;
