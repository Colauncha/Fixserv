import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    clientId: {
      type: String,
      required: true,
    },
    artisanId: {
      type: String,
      required: true,
    },
    serviceId: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    clientAddress: {
      street: String,
      city: String,
      postalCode: String,
      state: String,
      country: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    escrowStatus: {
      type: String,
      required: true,
      enum: ["NOT_PAID", "IN_ESCROW", "RELEASED", "DISPUTED"],
      default: "NOT_PAID",
    },
    paymentReference: {
      type: String,
      // required: true,
      unique: true, // Optional but helps prevent duplicates
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    completeddAt: {
      type: Date,
    },
    disputedId: {
      type: String,
      default: null,
    },
    uploadedProducts: [
      {
        id: String,
        imageUrl: String,
        description: String,
        objectName: String,
        uploadedAt: Date,
      },
    ],
  },
  { versionKey: false }
);

export const OrderModel = mongoose.model("OrderModel", OrderSchema);
