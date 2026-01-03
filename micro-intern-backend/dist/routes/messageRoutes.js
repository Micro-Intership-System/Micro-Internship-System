"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Message_1 = require("../models/Message");
const user_1 = require("../models/user");
const router = (0, express_1.Router)();
/**
 * POST /api/messages
 * Send a message to another user
 * body: { receiverId, text }
 */
router.post("/", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const sender = await user_1.User.findById(req.user.id);
        if (!sender) {
            return res
                .status(404)
                .json({ success: false, message: "Sender not found" });
        }
        const receiver = await user_1.User.findById(req.body.receiverId);
        if (!receiver) {
            return res
                .status(404)
                .json({ success: false, message: "Receiver not found" });
        }
        const msg = await Message_1.Message.create({
            senderId: sender._id,
            receiverId: receiver._id,
            text: req.body.text,
        });
        res.status(201).json({ success: true, data: msg });
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: "Invalid message data" });
    }
});
/**
 * GET /api/messages/thread/:userId
 * Get conversation between logged-in user and :userId
 */
router.get("/thread/:userId", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;
        const messages = await Message_1.Message.find({
            $or: [
                { senderId: currentUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUserId },
            ],
        })
            .sort({ createdAt: 1 })
            .populate("senderId", "name role")
            .populate("receiverId", "name role");
        res.json({ success: true, data: messages });
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: "Invalid user ID" });
    }
});
exports.default = router;
