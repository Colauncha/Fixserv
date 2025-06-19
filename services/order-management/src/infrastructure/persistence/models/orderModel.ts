import mongoose, { Schema, Document } from "mongoose";

// Define sub-schemas first
const DisputeDetailsSchema = new Schema(
  {
    disputeId: { type: String, required: true },
    reason: { type: String, required: true },
    openedAt: { type: Date, required: true, default: Date.now },
    resolvedAt: { type: Date },
    resolution: { type: String },
  },
  { _id: false }
);

const EscrowDetailsSchema = new Schema(
  {
    escrowId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["HELD", "RELEASED", "REFUNDED", "DISPUTED"],
      default: "HELD",
    },
    disputeDetails: { type: DisputeDetailsSchema },
  },
  { _id: false }
);

// Main Order Schema
const OrderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    artisanId: {
      type: String,
      required: true,
      index: true,
    },
    serviceId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["PENDING", "HELD_IN_ESCROW", "RELEASED", "REFUNDED", "DISPUTED"],
      default: "PENDING",
    },
    escrowDetails: {
      type: EscrowDetailsSchema,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Add indexes for better query performance
OrderSchema.index({ clientId: 1, status: 1 });
OrderSchema.index({ artisanId: 1, status: 1 });
OrderSchema.index({ status: 1, updatedAt: 1 });

// Add middleware to update the 'updatedAt' field on save
OrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add static methods for querying
OrderSchema.statics.findByStatus = function (status: string) {
  return this.find({ status });
};

OrderSchema.statics.findByClientAndStatus = function (
  clientId: string,
  status: string
) {
  return this.find({ clientId, status });
};

OrderSchema.statics.findByArtisanAndStatus = function (
  artisanId: string,
  status: string
) {
  return this.find({ artisanId, status });
};

// Create the model
interface IOrderDocument extends Document {
  orderId: string;
  clientId: string;
  artisanId: string;
  serviceId: string;
  status: string;
  paymentStatus: string;
  escrowDetails: {
    escrowId: string;
    amount: number;
    status: string;
    disputeDetails?: {
      disputeId: string;
      reason: string;
      openedAt: Date;
      resolvedAt?: Date;
      resolution?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IOrderModel extends mongoose.Model<IOrderDocument> {
  findByStatus(status: string): Promise<IOrderDocument[]>;
  findByClientAndStatus(
    clientId: string,
    status: string
  ): Promise<IOrderDocument[]>;
  findByArtisanAndStatus(
    artisanId: string,
    status: string
  ): Promise<IOrderDocument[]>;
}

export const OrderModel = mongoose.model<IOrderDocument, IOrderModel>(
  "Order",
  OrderSchema
);
