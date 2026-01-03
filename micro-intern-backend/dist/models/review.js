"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    quote: { type: String, required: true },
    avatarUrl: { type: String }
}, { timestamps: true });
exports.Review = (0, mongoose_1.model)("Review", reviewSchema);
