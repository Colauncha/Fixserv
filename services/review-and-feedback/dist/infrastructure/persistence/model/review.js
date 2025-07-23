"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = exports.reviewSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const feedback_1 = require("./feedback");
const rating_1 = require("./rating");
const uuid_1 = require("uuid");
exports.reviewSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        default: () => new mongoose_1.default.Types.ObjectId().toString(),
    },
    orderId: {
        type: String,
        required: true,
        default: uuid_1.v4,
    },
    artisanId: {
        type: String,
        required: true,
        ref: "ArtisanModel",
    },
    clientId: {
        type: String,
        required: true,
        ref: "ClientModel",
    },
    serviceId: {
        type: String,
        required: true,
        ref: "ServiceModel",
    },
    feedback: { type: feedback_1.feedbackSchema, required: true },
    artisanRating: { type: rating_1.ratingSchema, required: true },
    serviceRating: { type: rating_1.ratingSchema, required: true },
    status: {
        type: String,
        enum: ["pending", "published", "flagged"],
        default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
}, {
    versionKey: false,
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            ret.comment = ret.feedback.comment;
            ret.moderationNotes = ret.feedback.moderationNotes;
            ret.attachments = ret.feedback.attachments;
            delete ret.feedback;
            ret.ratingDimensions = ret.artisanRating.dimensions;
            ret.artisanRating = ret.artisanRating.value;
            ret.serviceRating = ret.serviceRating.value;
            ret.date = ret.createdAt;
            delete ret.createdAt;
        },
    },
});
exports.ReviewModel = mongoose_1.default.model("ReviewModel", exports.reviewSchema);
