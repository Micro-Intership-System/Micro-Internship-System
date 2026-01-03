"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseShopItem = void 0;
const mongoose_1 = require("mongoose");
const courseShopItemSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    cost: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    duration: { type: String, required: true },
    instructor: { type: String },
    thumbnailUrl: { type: String },
    learningOutcomes: [{ type: String }],
    prerequisites: [{ type: String }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.CourseShopItem = (0, mongoose_1.model)("CourseShopItem", courseShopItemSchema);
