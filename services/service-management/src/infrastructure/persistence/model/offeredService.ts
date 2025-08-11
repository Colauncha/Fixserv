import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const OfferedServiceSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    artisanId: { type: String, required: true },
    baseServiceId: { type: String, required: true, ref: "BaseServiceModel" },
    price: { type: Number, required: true },
    estimatedDuration: { type: String, required: true },
    rating: { type: Number, default: 0 },
    skillSet: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const OfferedServiceModel = mongoose.model(
  "OfferedServiceModel",
  OfferedServiceSchema
);
export { OfferedServiceModel };
