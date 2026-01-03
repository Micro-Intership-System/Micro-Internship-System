"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ContactRequest_1 = require("../models/ContactRequest");
const user_1 = require("../models/user");
const router = (0, express_1.Router)();
/**
 * POST /api/contact
 * Student sends contact request to employer
 * body: { employerId, email, message }
 * requires req.user.id (student)
 */
router.post("/", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const student = await user_1.User.findById(req.user.id);
        if (!student || student.role !== "student") {
            return res
                .status(403)
                .json({ success: false, message: "Student account required" });
        }
        const employer = await user_1.User.findById(req.body.employerId);
        if (!employer || employer.role !== "employer") {
            return res
                .status(404)
                .json({ success: false, message: "Employer not found" });
        }
        const reqDoc = await ContactRequest_1.ContactRequest.create({
            fromUserId: student._id,
            toUserId: employer._id,
            email: req.body.email,
            message: req.body.message,
        });
        res.status(201).json({ success: true, data: reqDoc });
    }
    catch (err) {
        console.error(err);
        res
            .status(400)
            .json({ success: false, message: "Invalid contact request data" });
    }
});
/**
 * GET /api/contact/incoming
 * Employer views incoming contact requests
 */
router.get("/incoming", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const employer = await user_1.User.findById(req.user.id);
        if (!employer || employer.role !== "employer") {
            return res
                .status(403)
                .json({ success: false, message: "Employer account required" });
        }
        const requests = await ContactRequest_1.ContactRequest.find({ toUserId: employer._id })
            .populate("fromUserId", "name email")
            .sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
exports.default = router;
