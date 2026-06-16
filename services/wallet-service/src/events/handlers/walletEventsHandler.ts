import {
  BadRequestError,
  EventAck,
  RedisEventBus,
} from "@fixserv-colauncha/shared";
import { WalletModel } from "../../infrastructure/persistence/models/walletModel";
import { ReferralService } from "../../application/services/referralService";

export class WalletEventsHandler {
  constructor(private eventBus: RedisEventBus) {}

  // private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  async setupSubscriptions() {
    const userEventSubscription = await this.eventBus.subscribe(
      "user_events",
      async (event: any) => {
        switch (event.eventName) {
          case "UserCreatedEvent":
            // await this.handleReviewCreated(new ReviewCreatedEvent(evt.//payload));
            await this.handleUserCreatedEvent(event);
            break;
          //case "ReviewPublished":
          //  await this.handleReviewPublished(
          //    new ReviewPublishedEvent(evt.payload)
          //  );
          // break;
          case "ArtisanVerifiedEvent":
            await this.handleArtisanVerified(event);
            break;

          case "ProfileCompletedEvent":
            await this.handleProfileCompleted(event);
            break;
          default:
            console.log("Unknown event type:", event.eventName);
        }
      },
    );
    this.subscriptions.push(userEventSubscription);
    console.log("Wallet-Service: Subscribed to user_events");

    // Subscribe to wallet events
    const walletEventSubscription = await this.eventBus.subscribe(
      "wallet_events",
      async (evt: any) => {
        switch (evt.eventName) {
          case "WalletTopUpEvent":
            await this.handleWalletTopUp(evt);
            break;
        }
      },
    );
    this.subscriptions.push(walletEventSubscription);
    console.log("Wallet-Service: Subscribed to wallet_events");

    //order events |  // NEW: listen for first booking
    const orderEventSub = await this.eventBus.subscribe(
      "order_events",
      async (event: any) => {
        switch (event.eventName) {
          case "OrderCreated": // fired when client confirms draft order
            await this.handleFirstBookingBonus(event);
            break;
        }
      },
    );
    this.subscriptions.push(orderEventSub);
    console.log("Wallet-Service: Subscribed to order_events");

    // ── review_events ───
    // NEW: listen for first feedback
    const reviewEventSub = await this.eventBus.subscribe(
      "review_events",
      async (event: any) => {
        switch (event.eventName) {
          case "ReviewCreated":
            await this.handleFirstFeedbackBonus(event);
            break;
        }
      },
    );
    this.subscriptions.push(reviewEventSub);
    console.log("Wallet-Service: Subscribed to review_events");
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleUserCreatedEventRefactor(event: any) {
    try {
      const { userId, role, fullName, referralCode } = event.payload;
      console.log(
        `📨 UserCreated: ${userId} [${role}] referral: ${referralCode || "none"}`,
      );

      const existingWallet = await WalletModel.findOne({ userId });
      if (existingWallet) {
        console.log(`Wallet already exists for user ${userId}`);
        await this.publishAck(event.id, "processed", "Wallet already exists");
        return;
      }

      // Create wallet and setup referral system atomically
      await ReferralService.createWalletWithReferral(
        userId,
        role,
        referralCode,
      );

      console.log(
        `✅ Wallet + referral setup complete for ${role} ${userId} (${fullName})`,
      );
      await this.publishAck(
        event.id,
        "processed",
        "Wallet created successfully",
      );
    } catch (error: any) {
      console.error(
        `❌ Failed wallet setup for user ${event.payload?.userId}:`,
        error,
      );
      await this.publishAck(event.id, "failed", error.message);
    }
  }

  private async handleUserCreatedEvent(event: any) {
    try {
      const { userId, role, fullName, referralCode } = event.payload;
      console.log(
        `📨 Processing user creation for ${userId}, role: ${role}, referral: ${
          referralCode || "none"
        }`,
      );

      // Process referral signup (creates fixpoints balance and handles referrals)
      const result = await ReferralService.handleUserSignup(
        userId,
        role as "CLIENT" | "ARTISAN",
        referralCode,
      );

      console.log(`✅ Referral system setup complete for user ${userId}:`, {
        points: result.fixpointsBalance.points,
        referralCode: result.referralCode.code,
        referrerReward: result.referrerReward?.pointsAwarded || 0,
      });

      const existingWallet = await WalletModel.findOne({ userId });
      // if (!existing) return;
      if (existingWallet) {
        console.log(`Wallet already exists for user ${userId}`);
        await this.publishAck(event.id, "processed", "Wallet already exists");
        return;
      }
      await WalletModel.create({
        userId,
        role,
        balance: 0,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Wallet created for ${role} user ${userId} (${fullName})`);
      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.id, "processed", "wallet created successfully"),
      );
    } catch (error: any) {
      //await this.eventBus.publish(
      //  "event_acks",
      //  new EventAck(event.id, "failed", "wallet-service", error.message)
      //);
      //throw new BadRequestError(error.message);
      console.error(
        `Failed to create wallet for user ${event.payload?.userId}:`,
        error,
      );
      await this.publishAck(event.id, "failed", error.message);
    }
  }
  private async publishAck(
    eventId: string,
    status: "processed" | "failed",
    message?: string,
  ) {
    try {
      await this.eventBus.publish(
        "event_acks",
        new EventAck(eventId, status, "wallet-service", message),
      );
    } catch (error) {
      console.error("Failed to publish acknowledgment:", error);
    }
  }
  private async handleWalletTopUp(event: any) {
    try {
      const { userId, amount, transactionId } = event.payload;
      const wallet = await WalletModel.findOne({ userId });
      if (!wallet) {
        console.error(`Wallet not found for user ${userId}`);
        await this.publishAck(event.id, "failed", "Wallet not found");
        return;
      }
      wallet.balance += amount;
      wallet.transactions.push({ amount, transactionId, type: "topup" });
      await wallet.save();
      console.log(`Wallet topped up for user ${userId}: ${amount}`);
      await this.publishAck(
        event.id,
        "processed",
        "Wallet topped up successfully",
      );
    } catch (error: any) {
      console.error(
        `Failed to top up wallet for user ${event.payload?.userId}:`,
        error,
      );
      await this.publishAck(event.id, "failed", error.message);
    }
  }

  private async handleArtisanVerified(event: any) {
    const { userId } = event.payload;

    try {
      // Award verification bonus
      await ReferralService.handleArtisanVerification(userId);

      console.log(`✅ Verification bonus awarded to artisan ${userId}`);
      await this.publishAck(
        event.id,
        "processed",
        "Verification bonus awarded",
      );
    } catch (error) {
      console.error(
        `❌ Failed to award verification bonus to ${userId}:`,
        error,
      );
    }
  }

  // ProfileCompleted → 100 fixpoints for both roles
  private async handleProfileCompleted(event: any) {
    try {
      const { userId, userType } = event.payload;
      console.log(`📨 ProfileCompleted: ${userId} [${userType}]`);

      const result = await ReferralService.handleProfileCompletion(
        userId,
        userType,
      );

      if (result.awarded) {
        console.log(
          `✅ Profile completion bonus awarded to ${userId}: ${result.points}pts`,
        );
      } else {
        console.log(`ℹ️ Profile completion bonus already awarded to ${userId}`);
      }
      await this.publishAck(event.id, "processed");
    } catch (error: any) {
      console.error(
        `❌ Profile completion bonus failed for ${event.payload?.userId}:`,
        error,
      );
      await this.publishAck(event.id, "failed", error.message);
    }
  }

  // NEW: OrderCreated → first booking bonus (CLIENT only)
  private async handleFirstBookingBonus(event: any) {
    try {
      const { clientId } = event.payload;
      if (!clientId) return;

      console.log(
        `📨 OrderCreated: checking first booking bonus for client ${clientId}`,
      );

      const result = await ReferralService.handleFirstBooking(clientId);

      if (result.awarded) {
        console.log(
          `✅ First booking bonus awarded to client ${clientId}: ${result.points}pts`,
        );
      } else {
        console.log(`ℹ️ First booking bonus already awarded to ${clientId}`);
      }
    } catch (error: any) {
      // Don't fail order creation if bonus award fails
      console.error(
        `❌ First booking bonus failed for ${event.payload?.clientId}:`,
        error,
      );
    }
  }

  /*
  private async handleFirstFeedbackBonus(event: any) {
    try {
      const { clientId } = event.payload;
      if (!clientId) return;

      console.log(
        `📨 ReviewCreated: checking first feedback bonus for client ${clientId}`,
      );

      const result = await ReferralService.handleFirstFeedback(clientId);

      if (result.awarded) {
        console.log(
          `✅ First feedback bonus awarded to client ${clientId}: ${result.points}pts`,
        );
      } else {
        console.log(`ℹ️ First feedback bonus already awarded to ${clientId}`);
      }
    } catch (error: any) {
      console.error(
        `❌ First feedback bonus failed for ${event.payload?.clientId}:`,
        error,
      );
    }
  }
  */
  private async handleFirstFeedbackBonus(event: any) {
    try {
      const { clientId, reviewId, orderId, hasComment } = event.payload;
      if (!clientId) return;
      console.log(
        `📨 ReviewCreated: checking first feedback bonus for client ${clientId}`,
      );
      if (!hasComment) {
        console.log(
          `ℹ️ Review ${reviewId} has no comment, skipping first feedback bonus for client ${clientId}`,
        );
        return;
      }
      const result = await ReferralService.handleFirstFeedback(
        clientId,
        reviewId,
        orderId,
      );
      if (result.awarded) {
        console.log(
          `✅ First feedback bonus awarded to client ${clientId}: ${result.points}pts`,
        );
      } else {
        console.log(`ℹ️ First feedback bonus already awarded to ${clientId}`);
      }
    } catch (error: any) {
      console.error(
        `❌ First feedback bonus failed for ${event.payload?.clientId}:`,
        error,
      );
    }
  }
}
