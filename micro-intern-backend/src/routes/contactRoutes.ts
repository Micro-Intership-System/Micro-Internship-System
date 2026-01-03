import { Router } from "express";
import { ContactRequest } from "../models/ContactRequest";
import { User } from "../models/user";

const router = Router();

/**
 * POST /api/contact
 * Student sends contact request to employer
 * body: { employerId, email, message }
 * requires req.user.id (student)
 */
router.post("/", async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const student = await User.findById(req.user.id);
    if (!student || student.role !== "student") {
      return res
        .status(403)
        .json({ success: false, message: "Student account required" });
    }

    const employer = await User.findById(req.body.employerId);
    if (!employer || employer.role !== "employer") {
      return res
        .status(404)
        .json({ success: false, message: "Employer not found" });
    }

    const reqDoc = await ContactRequest.create({
      fromUserId: student._id,
      toUserId: employer._id,
      email: req.body.email,
      message: req.body.message,
    });

    res.status(201).json({ success: true, data: reqDoc });
  } catch (err) {
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
router.get("/incoming", async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const employer = await User.findById(req.user.id);
    if (!employer || employer.role !== "employer") {
      return res
        .status(403)
        .json({ success: false, message: "Employer account required" });
    }

    const requests = await ContactRequest.find({ toUserId: employer._id })
      .populate("fromUserId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
