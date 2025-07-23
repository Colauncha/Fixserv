"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.ratingSchema = new mongoose_1.default.Schema({
    value: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    dimensions: {
        quality: { type: Number, min: 1, max: 5 },
        professionalism: { type: Number, min: 1, max: 5 },
        communication: { type: Number, min: 1, max: 5 },
        punctuality: { type: Number, min: 1, max: 5 },
    },
}, { _id: false });
