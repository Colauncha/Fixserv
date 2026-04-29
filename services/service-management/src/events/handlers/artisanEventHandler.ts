import { RedisEventBus } from "@fixserv-colauncha/shared";
import { EventAck } from "@fixserv-colauncha/shared";
import { ArtisanModel } from "../../infrastructure/persistence/model/artisanModel";

export class ArtisanEventsHandler {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  async setupSubscriptions() {
    const sub = await this.eventBus.subscribe(
      "artisan_events",
      async (event: any) => {
        console.log("Received artisan event:", event.eventName);
        if (
          event.eventName === "ArtisanCreated" ||
          event.eventName === "ArtisanCreatedEvent"
        ) {
          this.handleArtisanCreated(event);
        }
      },
    );
    this.subscriptions.push(sub);

    // Also subscribe to user_events to catch artisan registrations
    const userSub = await this.eventBus.subscribe(
      "user_events",
      async (event: any) => {
        console.log(
          `[service-management] Received user_events: ${event.eventName}`,
        );

        if (
          event.eventName === "UserCreatedEvent" &&
          event.payload?.role === "ARTISAN"
        ) {
          await this.handleUserCreatedForArtisan(event);
        }
      },
    );
    this.subscriptions.push(userSub);

    console.log(
      "Service-Management: Subscribed to artisan_events and user_events",
    );
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleArtisanCreated(event: any) {
    try {
      console.log("New artisan created:", event);

      const { userId, fullName, skills, businessName } = event.payload;
      // 🔥 UPSERT (important to avoid duplicates)
      await ArtisanModel.findOneAndUpdate(
        { userId },
        {
          userId,
          fullName,
          skills,
          businessName,
        },
        { upsert: true, new: true },
      );
      console.log(`✅ Artisan synced to service-management DB: ${userId}`);
      // Send ACK
      const ack = new EventAck(event.id, "processed", "service-management");
      await this.eventBus.publish("event_acks", ack);
    } catch (error: any) {
      const ack = new EventAck(
        event.id,
        "failed",
        "service-management",
        error.message,
      );
      await this.eventBus.publish("event_acks", ack);
    }
  }
  private async handleUserCreatedForArtisan(event: any) {
    try {
      const { userId, fullName, additionalData } = event.payload;

      // Only process artisan registrations
      if (event.payload.role !== "ARTISAN") return;

      await ArtisanModel.findOneAndUpdate(
        { userId },
        {
          userId,
          fullName,
          skills: additionalData?.skills || [],
          businessName: additionalData?.businessName || "",
        },
        { upsert: true, new: true },
      );

      console.log(`✅ Artisan synced from user_events: ${userId}`);
    } catch (error: any) {
      console.error("Failed to handle UserCreated for artisan:", error.message);
    }
  }
}
