import { RedisEventBus } from "@fixserv-colauncha/shared";
import { EventAck } from "@fixserv-colauncha/shared";

export class ArtisanEventsHandler {
  private eventBus = new RedisEventBus(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  async setupSubscriptions() {
    const sub = await this.eventBus.subscribe(
      "artisan_events",
      (event: any) => {
        if (event.eventName === "ArtisanCreated") {
          this.handleArtisanCreated(event);
        }
      }
    );
    this.subscriptions.push(sub);
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleArtisanCreated(event: any) {
    try {
      console.log("New artisan created:", event);

      // Send ACK
      const ack = new EventAck(event.id, "processed", "service-management");
      await this.eventBus.publish("event_acks", ack);
    } catch (error: any) {
      const ack = new EventAck(
        event.id,
        "failed",
        "service-management",
        error.message
      );
      await this.eventBus.publish("event_acks", ack);
    }
  }
}
