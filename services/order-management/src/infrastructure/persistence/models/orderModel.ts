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
      enum: [
        "PENDING_ARTISAN_RESPONSE",
        "IN_PROGRESS",
        "WORK_COMPLETED",
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
        "ACCEPTED",
      ],
      default: "PENDING_ARTISAN_RESPONSE",
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
      // unique: true, // Optional but helps prevent duplicates
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
    // New fields for artisan response
    artisanResponse: {
      status: {
        type: String,
        enum: ["ACCEPTED", "REJECTED"],
      },
      respondedAt: {
        type: Date,
      },
      rejectionReason: {
        type: String,
        enum: [
          "TOO_BUSY",
          "INSUFFICIENT_INFORMATION",
          "OUT_OF_SERVICE_AREA",
          "PRICE_TOO_LOW",
          "OTHER",
        ],
      },
      rejectionNote: {
        type: String,
      },
      estimatedCompletionDate: {
        type: Date,
      },
    },
    artisanResponseDeadline: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  },
  { versionKey: false }
);

export const OrderModel = mongoose.model("OrderModel", OrderSchema);
