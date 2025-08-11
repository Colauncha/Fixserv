import {
  RedisEventBus,
  EventAck,
  BadRequestError,
} from "@fixserv-colauncha/shared";
import { OrderCreatedEvent } from "../orderCreatedEvent";

export class OrderEventHandler {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  async setupSubscriptions() {
    console.log("📡 Subscribing to order_events channel...");
    const sub = await this.eventBus.subscribe(
      "order_events", // 👈 must match the channel used in order-management
      async (event: any) => {
        console.log("📥 Received event in service-management:", event);
        if (event.eventName === "OrderCreated") {
          await this.handleOrderCreated(event);
        } else {
          console.warn("⚠️ Unknown event:", event.eventName);
        }
      }
    );

    this.subscriptions.push(sub);
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleOrderCreated(event: OrderCreatedEvent) {
    try {
      console.log("📦 New order created for service:", event.payload.serviceId);

      // TODO: You can:
      // - increment a 'demand' counter on the service
      // - push service usage stats to analytics DB
      // - notify artisan of high order volume

      // example: await ServiceModel.updateOne({ _id: event.payload.serviceId }, { $inc: { orderCount: 1 } });

      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.payload.serviceId, "processed", "service-management")
      );
    } catch (error: any) {
      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.payload.serviceId, "failed", "service-management")
      );
      throw new BadRequestError(error.message);
    }
  }
}
