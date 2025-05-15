"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const ServiceSchema = new mongoose_1.default.Schema({
    _id: { type: String, required: true, default: uuid_1.v4 },
    artisanId: { type: String, ref: "ArtisanModel", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, min: 0, required: true },
    estimatedDuration: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5, required: true },
}, { timestamps: true });
const ServiceModel = mongoose_1.default.model("ServiceModel", ServiceSchema);
exports.ServiceModel = ServiceModel;
