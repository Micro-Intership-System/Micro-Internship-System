"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const anomaly_1 = require("../models/anomaly");
const anomalyDetection_1 = require("../utils/anomalyDetection");
const router = (0, express_1.Router)();
/**
 * GET /api/anomalies
 * Get all anomalies (admin only, or filtered by user)
 */
router.get("/", requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { status, type, severity } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (type)
            query.type = type;
        if (severity)
            query.severity = severity;
        // Non-admins can only see their own anomalies
        if (req.user?.role !== "admin") {
            query.$or = [
                { userId: req.user.id },
                { employerId: req.user.id },
                { studentId: req.user.id },
            ];
        }
        const anomalies = await anomaly_1.Anomaly.find(query)
            .populate("taskId", "title priorityLevel")
            .populate("userId", "name email")
            .populate("employerId", "name email companyName")
            .populate("studentId", "name email")
            .populate("resolvedBy", "name email")
            .sort({ detectedAt: -1 })
            .limit(100);
        res.json({ success: true, data: anomalies });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load anomalies" });
    }
});
/**
 * POST /api/anomalies/detect
 * Manually trigger anomaly detection (admin only)
 */
router.post("/detect", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admins only" });
        }
        const anomalies = await (0, anomalyDetection_1.runAnomalyDetection)();
        res.json({
            success: true,
            message: `Detected ${anomalies.length} new anomalies`,
            data: anomalies,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to run anomaly detection" });
    }
});
/**
 * PATCH /api/anomalies/:id/resolve
 * Resolve an anomaly (admin only)
 */
router.patch("/:id/resolve", requireAuth_1.requireAuth, async (req, res) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admins only" });
        }
        const { notes } = req.body;
        const anomaly = await anomaly_1.Anomaly.findById(req.params.id);
        if (!anomaly) {
            return res.status(404).json({ success: false, message: "Anomaly not found" });
        }
        anomaly.status = "resolved";
        anomaly.resolvedAt = new Date();
        anomaly.resolvedBy = req.user.id;
        if (notes)
            anomaly.notes = notes;
        await anomaly.save();
        res.json({ success: true, data: anomaly });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to resolve anomaly" });
    }
});
exports.default = router;
