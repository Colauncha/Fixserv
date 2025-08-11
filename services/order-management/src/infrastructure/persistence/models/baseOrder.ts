import mongoose, { Schema, Document } from "mongoose";

import { BaseOrder } from "../../../domain/entities/baseOrder";

export interface BaseOrderDocument extends Document {
  // id: string;
  clientId: string;
  artisanId: string;
  offeredServiceId: string;
  baseServiceId: string;
  price: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  createdAt: Date;
}

const baseOrderSchema = new Schema<BaseOrderDocument>(
  {
    // id: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    artisanId: { type: String, required: true },
    offeredServiceId: { type: String, required: true },
    baseServiceId: { type: String, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const BaseOrderModel = mongoose.model<BaseOrderDocument>(
  "BaseOrderModel",
  baseOrderSchema
);
