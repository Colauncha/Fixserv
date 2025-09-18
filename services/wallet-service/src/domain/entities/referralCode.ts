// domain/entities/ReferralCode.ts
import { v4 as uuidv4 } from "uuid";

export class ReferralCode {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly code: string,
    public readonly userType: "CLIENT" | "ARTISAN",
    public readonly createdAt: Date
  ) {}

  static generate(
    userId: string,
    userType: "CLIENT" | "ARTISAN"
  ): ReferralCode {
    // Generate format: FSV{userType}{userId_last4}{random4}
    const userIdLast4 = userId.slice(-4);
    const random4 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const typePrefix = userType === "CLIENT" ? "C" : "A";
    const code = `FSV${typePrefix}${userIdLast4}${random4}`;

    return new ReferralCode(uuidv4(), userId, code, userType, new Date());
  }

  isExpired(): boolean {
    // Referral codes never expire in your use case, but can be extended
    return false;
  }
}

// domain/entities/FixpointsBalance.ts
export class FixpointsBalance {
  constructor(
    public readonly userId: string,
    public points: number,
    public totalEarned: number,
    public totalRedeemed: number,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  addPoints(points: number, reason: string): FixpointsTransaction {
    this.points += points;
    this.totalEarned += points;
    this.updatedAt = new Date();

    return new FixpointsTransaction(
      uuidv4(),
      this.userId,
      "CREDIT",
      points,
      reason,
      new Date()
    );
  }

  canRedeem(points: number): boolean {
    return this.points >= points && points >= 1000; // Minimum 1000 points
  }

  redeemPoints(points: number, reason: string): FixpointsTransaction {
    if (!this.canRedeem(points)) {
      throw new Error("Insufficient points or below minimum redemption amount");
    }

    this.points -= points;
    this.totalRedeemed += points;
    this.updatedAt = new Date();

    return new FixpointsTransaction(
      uuidv4(),
      this.userId,
      "DEBIT",
      points,
      reason,
      new Date()
    );
  }

  getConversionValue(): { naira500: number; naira1000: number } {
    return {
      naira500: Math.floor(this.points / 500) * 1000, // 500 points = 1000 naira
      naira1000: Math.floor(this.points / 1000) * 2000, // 1000 points = 2000 naira
    };
  }
}

// domain/entities/FixpointsTransaction.ts
export class FixpointsTransaction {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: "CREDIT" | "DEBIT",
    public readonly points: number,
    public readonly reason: string,
    public readonly createdAt: Date,
    public readonly metadata?: {
      referredUserId?: string;
      referredUserType?: string;
      referralCode?: string;
      redemptionReference?: string;
    }
  ) {}
}

// domain/entities/ReferralReward.ts
export class ReferralReward {
  constructor(
    public readonly id: string,
    public readonly referrerId: string,
    public readonly referredUserId: string,
    public readonly referralCode: string,
    public readonly pointsAwarded: number,
    public readonly status: "PENDING" | "AWARDED" | "CANCELLED",
    public readonly createdAt: Date,
    public awardedAt?: Date
  ) {}

  static create(
    referrerId: string,
    referredUserId: string,
    referralCode: string,
    pointsAwarded: number = 150
  ): ReferralReward {
    return new ReferralReward(
      uuidv4(),
      referrerId,
      referredUserId,
      referralCode,
      pointsAwarded,
      "PENDING",
      new Date()
    );
  }

  award(): void {
    if (this.status !== "PENDING") {
      throw new Error(`Cannot award reward in status: ${this.status}`);
    }
    this.awardedAt = new Date();
  }
}
