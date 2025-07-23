"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.feedbackSchema = new mongoose_1.default.Schema({
    comment: { type: String, maxLength: 500, required: true },
    moderationNotes: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
}, { _id: false });
