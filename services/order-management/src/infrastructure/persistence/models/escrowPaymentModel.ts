import mongoose from "mongoose";

const EscrowPaymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    paymentReference: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    //clientId: { type: String, required: true },
    //artisanId: { type: String, required: true },
    status: {
      type: String,
      enum: ["NOT_PAID", "IN_ESCROW", "RELEASED", "DISPUTED"],
      default: "NOT_PAID",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    releasedAt: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
);

export const EscrowPaymentModel = mongoose.model(
  "EscrowPaymentModel",
  EscrowPaymentSchema
);
