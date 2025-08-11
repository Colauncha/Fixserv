import {
  BadRequestError,
  EventAck,
  RedisEventBus,
} from "@fixserv-colauncha/shared";
import { WalletModel } from "../../infrastructure/persistence/models/walletModel";

export class WalletEventsHandler {
  constructor() {}

  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
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
          default:
            console.log("Unknown event type:", event.eventName);
        }
      }
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
      }
    );
    this.subscriptions.push(walletEventSubscription);
    console.log("Wallet-Service: Subscribed to wallet_events");
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleUserCreatedEvent(event: any) {
    try {
      const { userId, role, fullName } = event.payload;
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
        new EventAck(event.id, "processed", "wallet created successfully")
      );
    } catch (error: any) {
      //await this.eventBus.publish(
      //  "event_acks",
      //  new EventAck(event.id, "failed", "wallet-service", error.message)
      //);
      //throw new BadRequestError(error.message);
      console.error(
        `Failed to create wallet for user ${event.payload?.userId}:`,
        error
      );
      await this.publishAck(event.id, "failed", error.message);
    }
  }
  private async publishAck(
    eventId: string,
    status: "processed" | "failed",
    message?: string
  ) {
    try {
      await this.eventBus.publish(
        "event_acks",
        new EventAck(eventId, status, "wallet-service", message)
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
        "Wallet topped up successfully"
      );
    } catch (error: any) {
      console.error(
        `Failed to top up wallet for user ${event.payload?.userId}:`,
        error
      );
      await this.publishAck(event.id, "failed", error.message);
    }
  }
}
