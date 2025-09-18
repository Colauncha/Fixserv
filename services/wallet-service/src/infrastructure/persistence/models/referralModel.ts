// infrastructure/persistence/models/referralModels.ts
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Fixpoints Transaction Interface
export interface IFixpointsTransaction {
  id: string;
  userId: string;
  type: "CREDIT" | "DEBIT";
  points: number;
  reason: string;
  createdAt: Date;
  metadata?: {
    referredUserId?: string;
    referredUserType?: string;
    referralCode?: string;
    redemptionReference?: string;
  };
}

// Fixpoints Transaction Schema
const FixpointsTransactionSchema = new mongoose.Schema<IFixpointsTransaction>(
  {
    id: { type: String, required: true, default: () => uuidv4() },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    points: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      required: true,
      enum: [
        "SIGNUP_BONUS",
        "VERIFICATION_BONUS",
        "REFERRAL_REWARD",
        "REDEMPTION",
        "ADMIN_ADJUSTMENT",
        "BONUS",
      ],
    },
    createdAt: { type: Date, default: Date.now },
    metadata: {
      referredUserId: { type: String },
      referredUserType: { type: String, enum: ["CLIENT", "ARTISAN"] },
      referralCode: { type: String },
      redemptionReference: { type: String },
    },
  },
  { _id: false, versionKey: false }
);

// Fixpoints Balance Interface
export interface IFixpointsBalance {
  userId: string;
  userType: "CLIENT" | "ARTISAN";
  points: number;
  totalEarned: number;
  canRedeem(points: number): boolean;
  getConversionValue(): any;
  totalRedeemed: number;
  transactions: IFixpointsTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

// Fixpoints Balance Schema
const FixpointsBalanceSchema = new mongoose.Schema<IFixpointsBalance>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ["CLIENT", "ARTISAN"],
      required: true,
    },
    points: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Points cannot be negative"],
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: [0, "Total earned cannot be negative"],
    },
    //canRedeem: {
    //  type: Boolean,
    //  default: false,
    //},
    totalRedeemed: {
      type: Number,
      default: 0,
      min: [0, "Total redeemed cannot be negative"],
    },
    transactions: [FixpointsTransactionSchema],
  },
  { timestamps: true }
);

// Add instance methods
FixpointsBalanceSchema.methods.canRedeem = function (points: number): boolean {
  return this.points >= points && points >= 1000;
};

FixpointsBalanceSchema.methods.getConversionValue = function (): {
  naira500: number;
  naira1000: number;
} {
  return {
    naira500: Math.floor(this.points / 500) * 1000,
    naira1000: Math.floor(this.points / 1000) * 2000,
  };
};

// Add static methods
FixpointsBalanceSchema.statics.findByUserId = function (userId: string) {
  return this.findOne({ userId });
};

export const FixpointsBalanceModel = mongoose.model<IFixpointsBalance>(
  "FixpointsBalance",
  FixpointsBalanceSchema
);

// Referral Code Interface
export interface IReferralCode {
  id: string;
  userId: string;
  code: string;
  userType: "CLIENT" | "ARTISAN";
  usageCount: number;
  maxUsage?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Referral Code Schema
const ReferralCodeSchema = new mongoose.Schema<IReferralCode>(
  {
    id: { type: String, required: true, default: () => uuidv4(), unique: true },
    userId: { type: String, required: true, index: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ["CLIENT", "ARTISAN"],
      required: true,
    },
    usageCount: { type: Number, default: 0, min: 0 },
    maxUsage: { type: Number }, // Optional limit
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Add methods to generate referral code
ReferralCodeSchema.statics.generateCode = function (
  userId: string,
  userType: "CLIENT" | "ARTISAN"
): string {
  const userIdLast4 = userId.slice(-4);
  const random4 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const typePrefix = userType === "CLIENT" ? "C" : "A";
  return `FSV${typePrefix}${userIdLast4}${random4}`;
};

ReferralCodeSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  this.updatedAt = new Date();
  return this.save();
};

export const ReferralCodeModel = mongoose.model<IReferralCode>(
  "ReferralCode",
  ReferralCodeSchema
);

// Referral Reward Interface
export interface IReferralReward {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  pointsAwarded: number;
  status: "PENDING" | "AWARDED" | "CANCELLED";
  reason?: string;
  createdAt: Date;
  awardedAt?: Date;
}

// Referral Reward Schema
const ReferralRewardSchema = new mongoose.Schema<IReferralReward>(
  {
    id: { type: String, required: true, default: () => uuidv4(), unique: true },
    referrerId: { type: String, required: true, index: true },
    referredUserId: { type: String, required: true, index: true },
    referralCode: { type: String, required: true, index: true },
    pointsAwarded: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["PENDING", "AWARDED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    reason: { type: String },
    awardedAt: { type: Date },
  },
  { timestamps: true }
);

// Add compound indexes for better query performance
ReferralRewardSchema.index({ referrerId: 1, status: 1 });
ReferralRewardSchema.index({ referredUserId: 1, status: 1 });
ReferralRewardSchema.index({ referralCode: 1, status: 1 });

// Prevent duplicate rewards for the same referral
ReferralRewardSchema.index(
  { referrerId: 1, referredUserId: 1 },
  { unique: true }
);

ReferralRewardSchema.methods.award = function () {
  if (this.status !== "PENDING") {
    throw new Error(`Cannot award reward in status: ${this.status}`);
  }
  this.status = "AWARDED";
  this.awardedAt = new Date();
  return this.save();
};

export const ReferralRewardModel = mongoose.model<IReferralReward>(
  "ReferralReward",
  ReferralRewardSchema
);

// Update the existing Wallet model to include referral integration
// Add this to your existing walletModel.ts

// Add referral fields to the Wallet schema
export const WalletReferralFields = {
  referralCode: { type: String, index: true }, // The user's referral code
  referredBy: { type: String }, // Who referred this user
  referralRewardsEarned: { type: Number, default: 0 }, // Total referral rewards earned
  hasReceivedSignupBonus: { type: Boolean, default: false },
  hasReceivedVerificationBonus: { type: Boolean, default: false },
};

// You can extend your existing WalletSchema like this:
/*
// In your existing walletModel.ts, add these fields:
WalletSchema.add({
  // Referral integration
  referralCode: { type: String, index: true },
  referredBy: { type: String },
  referralRewardsEarned: { type: Number, default: 0 },
  hasReceivedSignupBonus: { type: Boolean, default: false },
  hasReceivedVerificationBonus: { type: Boolean, default: false }
});
*/
