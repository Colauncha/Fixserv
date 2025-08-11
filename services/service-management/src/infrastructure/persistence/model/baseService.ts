import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const BaseServiceSchema = new mongoose.Schema(
  {
    _id: { type: String, default: uuidv4 },
    title: { type: String, required: true },
    description: { type: String, required: true },
    createdBy: { type: String, required: true }, // admin ID or system
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const BaseServiceModel = mongoose.model("BaseServiceModel", BaseServiceSchema);
export { BaseServiceModel };
