import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {
  BadRequestError,
  RedisEventBus,
  publishActivity,
  ACTIVITY_ACTIONS,
} from "@fixserv-colauncha/shared";
import { WalletModel } from "../../infrastructure/persistence/models/walletModel";
import {
  FixpointsBalanceModel,
  ReferralCodeModel,
  ReferralRewardModel,
  IFixpointsBalance,
  IReferralCode,
  IReferralReward,
} from "../../infrastructure/persistence/models/referralModel";

const FIXPOINTS_CONFIG = {
  SIGNUP_BONUS: 200,
  VERIFICATION_BONUS: 100,
  REFERRAL_REWARD: 150,
  PROFILE_COMPLETION_BONUS: 100,
  FIRST_BOOKING_BONUS: 100,
  FIRST_FEEDBACK_BONUS: 50,
};

export class ReferralService {
  private static eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  /**
   * Create a new user with referral system integration
   * This should be called when a new user signs up
   */
  static async handleUserSignup(
    userId: string,
    userType: "CLIENT" | "ARTISAN",
    referralCode?: string,
  ): Promise<{
    fixpointsBalance: IFixpointsBalance;
    referralCode: IReferralCode;
    referrerReward?: IReferralReward;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // console.log(
      // // `Processing signup for user ${userId} with referral code: ${referralCode}`,
      // );

      // 1. Create fixpoints balance with signup bonus
      let signupPoints = FIXPOINTS_CONFIG.SIGNUP_BONUS; // Base signup bonus
      const signupTransactions = [
        {
          id: uuidv4(),
          userId,
          type: "CREDIT" as const,
          points: signupPoints,
          reason: "SIGNUP_BONUS",
          createdAt: new Date(),
        },
      ];

      const fixpointsBalance = new FixpointsBalanceModel({
        userId,
        userType,
        points: signupPoints,
        totalEarned: signupPoints,
        totalRedeemed: 0,
        transactions: signupTransactions,
      });

      await fixpointsBalance.save({ session });

      /*
      // 2. Generate unique referral code for this user
      const generatedCode = this.generateUniqueReferralCode(userId, userType);
      let isCodeUnique = false;
      let attempts = 0;
      let finalCode = generatedCode;

      while (!isCodeUnique && attempts < 5) {
        const existingCode = await ReferralCodeModel.findOne({
          code: finalCode,
        }).session(session);
        if (!existingCode) {
          isCodeUnique = true;
        } else {
          attempts++;
          finalCode = this.generateUniqueReferralCode(userId, userType);
        }
      }

      if (!isCodeUnique) {
        throw new BadRequestError("Failed to generate unique referral code");
      }
      */
      // Generate unique referral code
      let finalCode = this.generateUniqueReferralCode(userId, userType);
      let attempts = 0;
      while (attempts < 5) {
        const exists = await ReferralCodeModel.findOne({
          code: finalCode,
        }).session(session);
        if (!exists) break;
        finalCode = this.generateUniqueReferralCode(userId, userType);
        attempts++;
      }
      if (attempts === 5)
        throw new BadRequestError("Failed to generate unique referral code");

      const userReferralCode = new ReferralCodeModel({
        userId,
        code: finalCode,
        userType,
        usageCount: 0,
        isActive: true,
      });

      await userReferralCode.save({ session });

      // 3. Handle referrer reward if user was referred
      let referrerReward: IReferralReward | undefined;
      if (referralCode) {
        try {
          referrerReward = await this.processReferralReward(
            userId,
            userType,
            referralCode,
            session,
          );
        } catch (referralError) {
          console.warn(
            "Failed to process referral reward, continuing with signup:",
            referralError,
          );
          // Don't fail the entire signup if referral processing fails
        }
      }

      await session.commitTransaction();
      console.log(`User ${userId} signup processed successfully`);

      // Notify new user about signup bonus
      await this.emitFixpointsNotification({
        userId,
        points: signupPoints,
        reason: "SIGNUP_BONUS",
        message: `Welcome to Fixserv! You've earned ${signupPoints} Fixpoints for signing up.`,
        title: "Signup Bonus Earned!",
        totalPoints: fixpointsBalance.points,
      });

      return {
        fixpointsBalance,
        referralCode: userReferralCode,
        referrerReward,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("Error in handleUserSignup:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Handle artisan verification - award verification bonus
   */
  static async handleArtisanVerification(userId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(`Processing verification bonus for artisan ${userId}`);

      // Check if user already received verification bonus
      const fixpointsBalance = await FixpointsBalanceModel.findOne({
        userId,
        userType: "ARTISAN",
      }).session(session);

      if (!fixpointsBalance) {
        throw new BadRequestError("Fixpoints balance not found for user");
      }

      // Check if already awarded (look in transactions)
      const hasVerificationBonus = fixpointsBalance.transactions.some(
        (tx) => tx.reason === "VERIFICATION_BONUS",
      );

      if (hasVerificationBonus) {
        console.log("Verification bonus already awarded");
        await session.commitTransaction();
        return;
      }

      // Award verification bonus
      const verificationPoints = FIXPOINTS_CONFIG.VERIFICATION_BONUS;
      const verificationTransaction = {
        id: uuidv4(),
        userId,
        type: "CREDIT" as const,
        points: verificationPoints,
        reason: "VERIFICATION_BONUS",
        createdAt: new Date(),
      };

      fixpointsBalance.points += verificationPoints;
      fixpointsBalance.totalEarned += verificationPoints;
      fixpointsBalance.transactions.push(verificationTransaction);
      fixpointsBalance.updatedAt = new Date();

      await fixpointsBalance.save({ session });
      await session.commitTransaction();

      await this.emitFixpointsNotification({
        userId,
        points: verificationPoints,
        reason: "VERIFICATION_BONUS",
        title: "Verification Bonus Earned!",
        message: `Your account has been verified! You've earned ${verificationPoints} Fixpoints.`,
        totalPoints: fixpointsBalance.points,
      });
      console.log(
        `Verification bonus of ${verificationPoints} points awarded to ${userId}`,
      );
    } catch (error) {
      await session.abortTransaction();
      console.error("Error in handleArtisanVerification:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Process referral reward for the referrer
   */
  private static async processReferralReward(
    referredUserId: string,
    referredUserType: "CLIENT" | "ARTISAN",
    referralCode: string,
    session: mongoose.mongo.ClientSession,
  ): Promise<IReferralReward> {
    console.log(`Processing referral reward for code: ${referralCode}`);

    // 1. Find the referral code
    const referralCodeDoc = await ReferralCodeModel.findOne({
      code: referralCode,
      isActive: true,
    }).session(session);

    if (!referralCodeDoc) {
      throw new BadRequestError("Invalid or inactive referral code");
    }

    // 2. Prevent self-referral
    if (referralCodeDoc.userId === referredUserId) {
      throw new BadRequestError("Cannot use your own referral code");
    }

    // 3. Check if referral reward already exists (prevent duplicates)
    const existingReward = await ReferralRewardModel.findOne({
      referrerId: referralCodeDoc.userId,
      referredUserId,
    }).session(session);

    if (existingReward) {
      console.log("Referral reward already exists for this pair");
      return existingReward;
    }

    // 4. Create referral reward record
    const referralReward = new ReferralRewardModel({
      referrerId: referralCodeDoc.userId,
      referredUserId,
      referralCode,
      pointsAwarded: FIXPOINTS_CONFIG.REFERRAL_REWARD, // Standard referral reward
      status: "PENDING",
    });

    await referralReward.save({ session });

    // 5. Award points to referrer
    const referrerBalance = await FixpointsBalanceModel.findOne({
      userId: referralCodeDoc.userId,
    }).session(session);

    if (referrerBalance) {
      const referralTransaction = {
        id: uuidv4(),
        userId: referralCodeDoc.userId,
        type: "CREDIT" as const,
        points: FIXPOINTS_CONFIG.REFERRAL_REWARD,
        reason: "REFERRAL_REWARD",
        createdAt: new Date(),
        metadata: {
          referredUserId,
          referredUserType,
          referralCode,
        },
      };

      referrerBalance.points += FIXPOINTS_CONFIG.REFERRAL_REWARD;
      referrerBalance.totalEarned += FIXPOINTS_CONFIG.REFERRAL_REWARD;
      referrerBalance.transactions.push(referralTransaction);
      referrerBalance.updatedAt = new Date();

      await referrerBalance.save({ session });

      // Mark reward as awarded
      referralReward.status = "AWARDED";
      referralReward.awardedAt = new Date();
      await referralReward.save({ session });

      await publishActivity({
  action: ACTIVITY_ACTIONS.FIXPOINTS_EARNED,
  actorId: referralCodeDoc.userId,
  actorRole: referrerBalance.userType,
  service: "wallet-service",
  metadata: { points: FIXPOINTS_CONFIG.REFERRAL_REWARD, reason: "REFERRAL_REWARD" },
});

      // Increment usage count
      referralCodeDoc.usageCount += 1;
      await referralCodeDoc.save({ session });

      // Notify referrer — runs after session commits in handleUserSignup
      // We store for post-commit emission
      setImmediate(async () => {
        await this.emitFixpointsNotification({
          userId: referralCodeDoc.userId,
          points: FIXPOINTS_CONFIG.REFERRAL_REWARD,
          reason: "REFERRAL_REWARD",
          title: "Referral Bonus Earned! 🎁",
          message: `Someone signed up using your referral code! You've earned ${FIXPOINTS_CONFIG.REFERRAL_REWARD} Fixpoints.`,
          totalPoints: referrerBalance.points,
          metadata: { referredUserId, referredUserType },
        });
      });

      console.log(
        `Referral reward of 150 points awarded to ${referralCodeDoc.userId}`,
      );
    }

    return referralReward;
  }

  /**
   * Redeem fixpoints for wallet credit
   */
  static async redeemFixpoints(
    userId: string,
    points: number,
  ): Promise<{
    nairaAmount: number;
    newPointsBalance: number;
    walletBalance: number;
    transactionReference: string;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log(
        `Processing fixpoints redemption: ${points} points for user ${userId}`,
      );

      // Validate redemption amount
      if (points < 1000) {
        throw new BadRequestError("Minimum redemption is 1000 fixpoints");
      }

      if (points % 500 !== 0) {
        throw new BadRequestError("Points must be in multiples of 500");
      }

      // Get user's fixpoints balance
      const fixpointsBalance = await FixpointsBalanceModel.findOne({
        userId,
      }).session(session);

      if (!fixpointsBalance) {
        throw new BadRequestError("Fixpoints balance not found");
      }

      if (!fixpointsBalance.canRedeem(points)) {
        throw new BadRequestError(
          "Insufficient fixpoints or below minimum redemption",
        );
      }

      // Calculate naira conversion
      const nairaAmount = this.convertFixpointsToNaira(points);
      const reference = `FXP_${userId}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // 1. Deduct fixpoints
      const redemptionTransaction = {
        id: uuidv4(),
        userId,
        type: "DEBIT" as const,
        points,
        reason: "REDEMPTION",
        createdAt: new Date(),
        metadata: {
          redemptionReference: reference,
        },
      };

      fixpointsBalance.points -= points;
      fixpointsBalance.totalRedeemed += points;
      fixpointsBalance.transactions.push(redemptionTransaction);
      fixpointsBalance.updatedAt = new Date();

      await fixpointsBalance.save({ session });

      // 2. Credit wallet
      let wallet = await WalletModel.findOne({ userId }).session(session);

      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = new WalletModel({
          userId,
          role: fixpointsBalance.userType,
          balance: 0,
          lockedBalance: 0,
          status: "ACTIVE",
          transactions: [],
        });
      }

      // Add naira to wallet
      wallet.balance += nairaAmount;
      wallet.transactions.push({
        id: uuidv4(),
        type: "CREDIT",
        purpose: "BONUS", // Using existing enum value
        amount: nairaAmount,
        reference,
        description: `Fixpoints redemption: ${points} points converted to ₦${nairaAmount}`,
        createdAt: new Date(),
        status: "SUCCESS",
      });

      await wallet.save({ session });

      await session.commitTransaction();

      console.log(
        `Successfully redeemed ${points} fixpoints for ₦${nairaAmount}`,
      );

      await publishActivity({
        action: ACTIVITY_ACTIONS.FIXPOINTS_REDEEMED,
        actorId: userId,
        actorRole: fixpointsBalance.userType,
        service: "wallet-service",
        metadata: { points, nairaAmount, reference },
      });

      return {
        nairaAmount,
        newPointsBalance: fixpointsBalance.points,
        walletBalance: wallet.balance,
        transactionReference: reference,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error("Error in redeemFixpoints:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get user's fixpoints balance and summary
   */
  static async getFixpointsBalance(userId: string) {
    try {
      const balance = await FixpointsBalanceModel.findOne({ userId });

      if (!balance) {
        throw new BadRequestError("Fixpoints balance not found");
      }

      const conversionValues = balance.getConversionValue();

      return {
        userId: balance.userId,
        userType: balance.userType,
        points: balance.points,
        totalEarned: balance.totalEarned,
        totalRedeemed: balance.totalRedeemed,
        canRedeem: balance.canRedeem(1000),
        conversionOptions: {
          option500: {
            points: 500,
            naira: 1000,
            available: Math.floor(balance.points / 500),
          },
          option1000: {
            points: 1000,
            naira: 2000,
            available: Math.floor(balance.points / 1000),
          },
        },
        recentTransactions: balance.transactions
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10),
      };
    } catch (error) {
      console.error("Error getting fixpoints balance:", error);
      throw error;
    }
  }

  /**
   * Get user's referral information
   */
  static async getReferralInfo(userId: string) {
    try {
      const [referralCode, referralRewards, referredUsers] = await Promise.all([
        ReferralCodeModel.findOne({ userId, isActive: true }),
        ReferralRewardModel.find({ referrerId: userId }).sort({
          createdAt: -1,
        }),
        ReferralRewardModel.find({ referredUserId: userId }),
      ]);

      return {
        myReferralCode: referralCode?.code,
        totalReferrals: referralCode?.usageCount || 0,
        referralRewards: referralRewards.map((reward) => ({
          id: reward.id,
          referredUserId: reward.referredUserId,
          pointsAwarded: reward.pointsAwarded,
          status: reward.status,
          createdAt: reward.createdAt,
          awardedAt: reward.awardedAt,
        })),
        referredBy:
          referredUsers.length > 0 ? referredUsers[0].referralCode : null,
        totalPointsFromReferrals: referralRewards
          .filter((r) => r.status === "AWARDED")
          .reduce((sum, r) => sum + r.pointsAwarded, 0),
      };
    } catch (error) {
      console.error("Error getting referral info:", error);
      throw error;
    }
  }

  /**
   * Get referral analytics (admin/stats)
   */
  static async getReferralAnalytics() {
    try {
      const [totalReferrals, activeReferralCodes, totalPointsAwarded] =
        await Promise.all([
          ReferralRewardModel.countDocuments({ status: "AWARDED" }),
          ReferralCodeModel.countDocuments({ isActive: true }),
          ReferralRewardModel.aggregate([
            { $match: { status: "AWARDED" } },
            { $group: { _id: null, total: { $sum: "$pointsAwarded" } } },
          ]),
        ]);

      return {
        totalSuccessfulReferrals: totalReferrals,
        activeReferralCodes,
        totalPointsAwarded: totalPointsAwarded[0]?.total || 0,
        averagePointsPerReferral:
          totalReferrals > 0
            ? Math.round((totalPointsAwarded[0]?.total || 0) / totalReferrals)
            : 0,
      };
    } catch (error) {
      console.error("Error getting referral analytics:", error);
      throw error;
    }
  }

  // Helper methods
  private static generateUniqueReferralCode(
    userId: string,
    userType: "CLIENT" | "ARTISAN",
  ): string {
    const userIdLast4 = userId.slice(-4);
    const random4 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const typePrefix = userType === "CLIENT" ? "C" : "A";
    return `FSV${typePrefix}${userIdLast4}${random4}`;
  }

  private static convertFixpointsToNaira(points: number): number {
    if (points >= 1000 && points % 1000 === 0) {
      return Math.floor(points / 1000) * 2000; // 1000 points = 2000 naira
    } else if (points >= 500 && points % 500 === 0) {
      return Math.floor(points / 500) * 1000; // 500 points = 1000 naira
    }
    throw new BadRequestError("Invalid point conversion amount");
  }

  /**
   * Validate referral code format
   */
  static validateReferralCode(code: string): boolean {
    const pattern = /^FSV[CA][0-9A-Z]{8}$/;
    return pattern.test(code);
  }

  /**
   * Get fixpoints transaction history
   */
  static async getTransactionHistory(userId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const balance = await FixpointsBalanceModel.findOne({ userId });
      if (!balance) {
        throw new BadRequestError("Fixpoints balance not found");
      }

      const transactions = balance.transactions
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(skip, skip + limit);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total: balance.transactions.length,
          totalPages: Math.ceil(balance.transactions.length / limit),
        },
        summary: {
          currentBalance: balance.points,
          totalEarned: balance.totalEarned,
          totalRedeemed: balance.totalRedeemed,
        },
      };
    } catch (error) {
      console.error("Error getting transaction history:", error);
      throw error;
    }
  }

  /**
   * Enhanced wallet creation that integrates with referral system
   * Call this instead of creating wallet directly
   */
  static async createWalletWithReferral(
    userId: string,
    userType: "CLIENT" | "ARTISAN",
    referralCode?: string,
  ) {
    try {
      // 1. Process referral signup (creates fixpoints balance and handles referrals)
      const referralResult = await ReferralService.handleUserSignup(
        userId,
        userType,
        referralCode,
      );

      // 2. Create traditional wallet
      const wallet = new WalletModel({
        userId,
        role: userType,
        balance: 0,
        lockedBalance: 0,
        status: "ACTIVE",
        transactions: [],
        // Link to referral system
        referralCode: referralResult.referralCode.code,
        referredBy: referralCode || null,
      });

      await wallet.save();

      return {
        wallet,
        fixpointsBalance: referralResult.fixpointsBalance,
        referralInfo: {
          myReferralCode: referralResult.referralCode.code,
          referrerReward: referralResult.referrerReward,
        },
      };
    } catch (error) {
      console.error("Error creating wallet with referral:", error);
      throw error;
    }
  }

  /**
   * Enhanced verification that awards fixpoints bonus
   */
  static async verifyArtisanWithBonus(userId: string) {
    try {
      // Your existing verification logic here...

      // Award fixpoints verification bonus
      await ReferralService.handleArtisanVerification(userId);

      return { message: "Artisan verified and bonus awarded" };
    } catch (error) {
      console.error("Error verifying artisan with bonus:", error);
      throw error;
    }
  }

  // NEW: Profile Completion Bonus (CLIENT & ARTISAN)
  static async handleProfileCompletion(
    userId: string,
    userType: "CLIENT" | "ARTISAN",
  ): Promise<{ awarded: boolean; points: number; totalPoints: number }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fixpointsBalance = await FixpointsBalanceModel.findOne({
        userId,
      }).session(session);
      if (!fixpointsBalance)
        throw new BadRequestError("Fixpoints balance not found");

      // Idempotency check — only award once
      const alreadyAwarded = fixpointsBalance.transactions.some(
        (tx) => tx.reason === "PROFILE_COMPLETION_BONUS",
      );
      if (alreadyAwarded) {
        await session.commitTransaction();
        return {
          awarded: false,
          points: 0,
          totalPoints: fixpointsBalance.points,
        };
      }

      const points = FIXPOINTS_CONFIG.PROFILE_COMPLETION_BONUS;
      fixpointsBalance.points += points;
      fixpointsBalance.totalEarned += points;
      fixpointsBalance.transactions.push({
        id: uuidv4(),
        userId,
        type: "CREDIT",
        points,
        reason: "PROFILE_COMPLETION_BONUS",
        createdAt: new Date(),
      });
      fixpointsBalance.updatedAt = new Date();
      await fixpointsBalance.save({ session });
      await session.commitTransaction();

      // Emit fixpoints notification
      await this.emitFixpointsNotification({
        userId,
        points,
        reason: "PROFILE_COMPLETION_BONUS",
        title: "Profile Complete! 🎉",
        message: `Great job completing your profile! You've earned ${points} Fixpoints.`,
        totalPoints: fixpointsBalance.points,
      });

      console.log(
        `✅ Profile completion bonus of ${points} awarded to ${userId}`,
      );
      return { awarded: true, points, totalPoints: fixpointsBalance.points };
    } catch (error) {
      await session.abortTransaction();
      console.error("Error in handleProfileCompletion:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // NEW: First Booking Bonus (CLIENT only)
  static async handleFirstBooking(
    clientId: string,
  ): Promise<{ awarded: boolean; points: number; totalPoints: number }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fixpointsBalance = await FixpointsBalanceModel.findOne({
        userId: clientId,
        userType: "CLIENT",
      }).session(session);

      if (!fixpointsBalance)
        throw new BadRequestError("Fixpoints balance not found");

      // Idempotency check
      const alreadyAwarded = fixpointsBalance.transactions.some(
        (tx) => tx.reason === "FIRST_BOOKING_BONUS",
      );
      if (alreadyAwarded) {
        await session.commitTransaction();
        return {
          awarded: false,
          points: 0,
          totalPoints: fixpointsBalance.points,
        };
      }

      const points = FIXPOINTS_CONFIG.FIRST_BOOKING_BONUS;
      fixpointsBalance.points += points;
      fixpointsBalance.totalEarned += points;
      fixpointsBalance.transactions.push({
        id: uuidv4(),
        userId: clientId,
        type: "CREDIT",
        points,
        reason: "FIRST_BOOKING_BONUS",
        createdAt: new Date(),
      });
      fixpointsBalance.updatedAt = new Date();
      await fixpointsBalance.save({ session });
      await session.commitTransaction();

      await this.emitFixpointsNotification({
        userId: clientId,
        points,
        reason: "FIRST_BOOKING_BONUS",
        title: "First Booking Bonus! 🛠️",
        message: `You've earned ${points} Fixpoints for confirming your first repair booking!`,
        totalPoints: fixpointsBalance.points,
      });

      console.log(
        `✅ First booking bonus of ${points} awarded to client ${clientId}`,
      );
      return { awarded: true, points, totalPoints: fixpointsBalance.points };
    } catch (error) {
      await session.abortTransaction();
      console.error("Error in handleFirstBooking:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // NEW: First Feedback Bonus (CLIENT only)
  static async handleFirstFeedback1(
    clientId: string,
  ): Promise<{ awarded: boolean; points: number; totalPoints: number }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fixpointsBalance = await FixpointsBalanceModel.findOne({
        userId: clientId,
        userType: "CLIENT",
      }).session(session);

      if (!fixpointsBalance)
        throw new BadRequestError("Fixpoints balance not found");

      // Idempotency check
      const alreadyAwarded = fixpointsBalance.transactions.some(
        (tx) => tx.reason === "FIRST_FEEDBACK_BONUS",
      );
      if (alreadyAwarded) {
        await session.commitTransaction();
        return {
          awarded: false,
          points: 0,
          totalPoints: fixpointsBalance.points,
        };
      }

      const points = FIXPOINTS_CONFIG.FIRST_FEEDBACK_BONUS;
      fixpointsBalance.points += points;
      fixpointsBalance.totalEarned += points;
      fixpointsBalance.transactions.push({
        id: uuidv4(),
        userId: clientId,
        type: "CREDIT",
        points,
        reason: "FIRST_FEEDBACK_BONUS",
        createdAt: new Date(),
      });
      fixpointsBalance.updatedAt = new Date();
      await fixpointsBalance.save({ session });
      await session.commitTransaction();

      await this.emitFixpointsNotification({
        userId: clientId,
        points,
        reason: "FIRST_FEEDBACK_BONUS",
        title: "Feedback Bonus! ⭐",
        message: `Thank you for your feedback! You've earned ${points} Fixpoints for your first review.`,
        totalPoints: fixpointsBalance.points,
      });

      console.log(
        `✅ First feedback bonus of ${points} awarded to client ${clientId}`,
      );
      return { awarded: true, points, totalPoints: fixpointsBalance.points };
    } catch (error) {
      await session.abortTransaction();
      console.error("Error in handleFirstFeedback:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async handleFirstFeedback(
    clientId: string,
    reviewId: string,
    orderId: string,
  ): Promise<{ awarded: boolean; points: number; totalPoints: number }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fixpointsBalance = await FixpointsBalanceModel.findOne({
        userId: clientId,
        userType: "CLIENT",
      }).session(session);

      if (!fixpointsBalance)
        throw new BadRequestError("Fixpoints balance not found");

      // Idempotency guard — one award per reviewId
      const alreadyAwarded = fixpointsBalance.transactions.some(
        (tx) =>
          // tx.reason === "FIRST_FEEDBACK_BONUS" &&
          // tx.metadata?.reviewId === reviewId,
          tx.reason === "FIRST_FEEDBACK_BONUS",
      );

      if (alreadyAwarded) {
        await session.commitTransaction();
        return {
          awarded: false,
          points: 0,
          totalPoints: fixpointsBalance.points,
        };
      }

      const points = FIXPOINTS_CONFIG.FIRST_FEEDBACK_BONUS;
      fixpointsBalance.points += points;
      fixpointsBalance.totalEarned += points;
      fixpointsBalance.transactions.push({
        id: uuidv4(),
        userId: clientId,
        type: "CREDIT",
        points,
        reason: "FIRST_FEEDBACK_BONUS",
        createdAt: new Date(),
        metadata: {
          reviewId, // idempotency key — one award per review
          orderId,
        },
      });
      fixpointsBalance.updatedAt = new Date();
      await fixpointsBalance.save({ session });
      await session.commitTransaction();

      // Emit notification
      await this.emitFixpointsNotification({
        userId: clientId,
        points,
        reason: "FIRST_FEEDBACK_BONUS",
        title: "First Feedback Bonus! 🎉",
        message: `You earned ${points} Fixpoints for your first review!`,
        totalPoints: fixpointsBalance.points,
        metadata: { reviewId, orderId },
      });

      console.log(
        `✅ First feedback bonus of ${points}pts awarded to client ${clientId} for review ${reviewId}`,
      );
      return { awarded: true, points, totalPoints: fixpointsBalance.points };
    } catch (error) {
      await session.abortTransaction();
      console.error("Error in handleCommentBonus:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // PRIVATE: Central notification emitter
  private static async emitFixpointsNotification(payload: {
    userId: string;
    points: number;
    reason: string;
    title: string;
    message: string;
    totalPoints: number;
    metadata?: Record<string, any>;
  }) {
    try {
      await this.eventBus.publish("fixpoints_events", {
        eventName: "FixpointsAwarded",
        payload: {
          ...payload,
          timestamp: new Date(),
        },
      });
      console.log(
        `📢 FixpointsAwarded event emitted for user ${payload.userId} [${payload.reason}]`,
      );
    } catch (error) {
      // Never let notification failure break core logic
      console.error("Failed to emit fixpoints notification:", error);
    }
  }
}
