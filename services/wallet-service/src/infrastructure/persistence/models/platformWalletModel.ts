import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const PlatformTransactionSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => uuidv4() },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    amount: { type: Number, required: true },
    purpose: {
      type: String,
      enum: [
        "PLATFORM_FEE", // 5% from completed orders
        "ADMIN_WITHDRAWAL", // admin withdraws platform earnings
        "REFUND_ADJUSTMENT", // rare: manual correction
      ],
      required: true,
    },
    orderId: { type: String }, // which order generated this fee
    clientId: { type: String },
    artisanId: { type: String },
    reference: { type: String },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const PlatformWalletSchema = new mongoose.Schema(
  {
    // Singleton identifier — always "fixserv_platform"
    accountId: { type: String, default: "fixserv_platform", unique: true },
    balance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    transactions: [PlatformTransactionSchema],
  },
  { timestamps: true },
);

const PlatformWalletModel = mongoose.model(
  "PlatformWallet",
  PlatformWalletSchema,
);

export { PlatformWalletModel };
