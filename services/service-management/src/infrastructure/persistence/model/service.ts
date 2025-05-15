import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const ServiceSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true, default: uuidv4 },
    artisanId: { type: String, ref: "ArtisanModel", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, min: 0, required: true },
    estimatedDuration: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5, required: true },
  },
  { timestamps: true }
);

const ServiceModel = mongoose.model("ServiceModel", ServiceSchema);
export { ServiceModel };
