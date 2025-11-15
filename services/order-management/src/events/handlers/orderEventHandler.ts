import { BadRequestError, RedisEventBus } from "@fixserv-colauncha/shared";
import { EventAck } from "@fixserv-colauncha/shared";
import {
  OrderCreatedEvent,
  PaymentReleasedEvent,
  PaymentInitiatedEvent,
} from "../orderEvents";

export class OrderEventsHandler {
  // private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];
  constructor(private eventBus: RedisEventBus) {}

  async setupSubscriptions() {
    const sub = await this.eventBus.subscribe(
      "order_events",
      async (
        event: OrderCreatedEvent | PaymentInitiatedEvent | PaymentReleasedEvent
      ) => {
        if (
          event.eventName === "OrderCreated" ||
          event.eventName === "OrderPaymentReleased" ||
          event.eventName === "OrderPaymentInitiated"
        ) {
          await this.onOrderEvent(event);
        }
      }
    );
    this.subscriptions.push(sub);
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }
  private async onOrderEvent(
    event: OrderCreatedEvent | PaymentInitiatedEvent | PaymentReleasedEvent
  ) {
    try {
      switch (event.eventName) {
        case "OrderCreated":
          console.log("📦 Order created event received", event.payload);
          // Do something with new order info (e.g., notify artisan or analytics)
          console.log("📤 Publishing OrderCreatedEvent:", event);
          await this.eventBus.publish(
            "event_acks",
            new EventAck(event.id, "processed", "order-management")
          );
          break;
        case "OrderPaymentInitiated":
          console.log("💰 Payment initiated", event.payload);
          // Update payment logs, notify user, etc.
          break;
        case "OrderPaymentReleased":
          console.log("✅ Payment released to artisan", event.payload);
          // Credit artisan wallet or emit another event
          break;
        default:
          console.warn("⚠️ Unknown event:", event.eventName);
      }

      //console.log("📤 Publishing OrderCreatedEvent:", event);
      //await this.eventBus.publish(
      //  "event_acks",
      //  new EventAck(event.id, "processed", "order-management")
      //);
    } catch (error: any) {
      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.id, "failed", "order-management", error.message)
      );
      throw new BadRequestError(error.message);
    }
  }
}
