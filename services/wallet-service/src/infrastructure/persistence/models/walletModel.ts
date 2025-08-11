import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
interface IWalletTransaction {
  orderId: string;
  userId: string;
  amount: number;
  status: "LOCKED" | "COMPLETED" | "REFUNDED";
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new mongoose.Schema<IWalletTransaction>(
  {
    orderId: { type: String, required: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["LOCKED", "COMPLETED", "REFUNDED"],
      required: true,
    },
  },
  { timestamps: true }
);

export const WalletTransactionModel = mongoose.model<IWalletTransaction>(
  "WalletTransactionModel",
  WalletTransactionSchema
);

const TransactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, default: () => uuidv4() },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    // purpose: { type: String, required: true },
    purpose: { type: String },
    amount: { type: Number, required: true },
    reference: { type: String },
    // description: { type: String, required: true },
    description: { type: String },
    createdAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      // required: true,
    },
  },
  { _id: false, versionKey: false }
);

const WalletSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    role: { type: String, enum: ["CLIENT", "ARTISAN"], required: true },
    balance: { type: Number, required: true, default: 0 },
    transactions: [TransactionSchema],
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "CLOSED", "COMPLETED"],
      default: "ACTIVE",
      // required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lockedBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const WalletModel = mongoose.model("WalletModel", WalletSchema);
