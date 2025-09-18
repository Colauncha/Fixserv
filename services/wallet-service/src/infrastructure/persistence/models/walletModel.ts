import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { WalletReferralFields } from "./referralModel";
interface IWalletTransaction {
  orderId: string;
  userId: string;
  amount: number;
  status: "LOCKED" | "COMPLETED" | "REFUNDED";
  createdAt: Date;
  updatedAt: Date;
}

// NEW: Withdrawal request interface
export interface IWithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  recipientCode: string;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  transferCode?: string;
  reference: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REVERSED";
  reason?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// NEW: Withdrawal request schema
const WithdrawalRequestSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => uuidv4(),
      unique: true,
    },
    userId: { type: String, required: true, index: true },
    amount: {
      type: Number,
      required: true,
      min: [100, "Minimum withdrawal amount is 100 NGN"],
    },
    recipientCode: { type: String, required: true },
    accountNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^\d{10}$/.test(v);
        },
        message: "Account number must be 10 digits",
      },
    },
    bankCode: { type: String, required: true },
    accountName: { type: String, required: true },
    transferCode: { type: String }, // Set when transfer is initiated
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REVERSED"],
      default: "PENDING",
      index: true,
    },
    reason: {
      type: String,
      default: "Wallet withdrawal",
    },
    failureReason: { type: String }, // Set if withdrawal fails
  },
  {
    timestamps: true,
    // Add indexes for better query performance
    index: [
      { userId: 1, createdAt: -1 },
      { status: 1, createdAt: 1 },
      { reference: 1 },
      { transferCode: 1 },
    ],
  }
);

export const WithdrawalRequestModel = mongoose.model<IWithdrawalRequest>(
  "WithdrawalRequest",
  WithdrawalRequestSchema
);

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
    purpose: {
      type: String,
      enum: [
        // Existing purposes
        "LOCKED_ESCROW",
        "PAYMENT_COMPLETED",
        "PAYMENT_RECEIVED",
        "REFUND",
        // NEW: Withdrawal purposes
        "WITHDRAWAL_PENDING",
        "WITHDRAWAL_COMPLETED",
        "WITHDRAWAL_FAILED",
        "WITHDRAWAL_REFUND",
        // Other purposes
        "TOP_UP",
        "ADMIN_CREDIT",
        "ADMIN_DEBIT",
        "BONUS",
        "CASHBACK",
        // NEW: Add these for referral system
        "FIXPOINTS_REDEMPTION", // When user converts fixpoints to naira
        "REFERRAL_BONUS", // When user gets bonus from referrals
      ],
    },
    amount: { type: Number, required: true },
    reference: { type: String },
    // description: { type: String, required: true },
    description: { type: String },
    createdAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "SUCCESS",
      // required: true,
      // NEW: Additional fields for better tracking
      metadata: {
        // For withdrawal transactions
        accountNumber: { type: String },
        accountName: { type: String },
        bankName: { type: String },
        // For order transactions
        orderId: { type: String },
        artisanId: { type: String },
        // General metadata
        source: { type: String }, // 'paystack', 'admin', 'system'
        externalReference: { type: String },
      },
    },
  },
  { _id: false, versionKey: false }
);

const WalletSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    role: { type: String, enum: ["CLIENT", "ARTISAN"], required: true },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    transactions: [TransactionSchema],
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "CLOSED", "COMPLETED", "FROZEN"],
      default: "ACTIVE",
      // required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lockedBalance: {
      type: Number,
      default: 0,
      min: [0, "Locked balance cannot be negative"],
    },
    // NEW: Track withdrawal limits and statistics
    totalWithdrawn: { type: Number, default: 0 },
    totalDeposited: { type: Number, default: 0 },
    withdrawalLimit: {
      daily: { type: Number, default: 500000 }, // 500,000 NGN daily limit
      monthly: { type: Number, default: 2000000 }, // 2,000,000 NGN monthly limit
    },
    lastWithdrawalDate: { type: Date },
    withdrawalCount: {
      daily: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 },
      lastReset: { type: Date, default: Date.now },
    },
    // NEW: Security and verification fields
    isVerified: { type: Boolean, default: false },
    kycLevel: {
      type: String,
      enum: ["NONE", "BASIC", "FULL"],
      default: "NONE",
    },
    pinHash: { type: String }, // Hashed withdrawal PIN
    twoFactorEnabled: { type: Boolean, default: false },
    //Wallet referral
    walletReferral: WalletReferralFields,
  },
  { timestamps: true }
);
// Add instance methods for withdrawal limit checking
WalletSchema.methods.canWithdraw = function (amount: number): {
  allowed: boolean;
  reason?: string;
} {
  if (this.status !== "ACTIVE") {
    return { allowed: false, reason: "Wallet is not active" };
  }

  if (amount > this.balance - this.lockedBalance) {
    return { allowed: false, reason: "Insufficient available balance" };
  }

  // Check daily limit
  const today = new Date();
  const isNewDay =
    !this.lastWithdrawalDate ||
    this.lastWithdrawalDate.toDateString() !== today.toDateString();

  if (isNewDay) {
    // Reset daily counter
    this.withdrawalCount.daily = 0;
  }

  const dailyWithdrawn = this.withdrawalCount.daily || 0;
  if (dailyWithdrawn + amount > this.withdrawalLimit.daily) {
    return {
      allowed: false,
      reason: `Daily withdrawal limit (₦${this.withdrawalLimit.daily.toLocaleString()}) would be exceeded`,
    };
  }

  return { allowed: true };
};

// Add static methods
WalletSchema.statics.findByUserId = function (userId: string) {
  return this.findOne({ userId });
};

WalletSchema.statics.getWithdrawalStats = function () {
  return this.aggregate([
    { $match: { status: "ACTIVE" } },
    {
      $group: {
        _id: null,
        totalWallets: { $sum: 1 },
        totalBalance: { $sum: "$balance" },
        totalLocked: { $sum: "$lockedBalance" },
        totalWithdrawn: { $sum: "$totalWithdrawn" },
        totalDeposited: { $sum: "$totalDeposited" },
      },
    },
  ]);
};

export const WalletModel = mongoose.model("WalletModel", WalletSchema);
