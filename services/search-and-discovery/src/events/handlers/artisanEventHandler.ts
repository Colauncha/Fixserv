import { RedisEventBus, EventAck } from "@fixserv-colauncha/shared";
import { ArtisanModel } from "../../modules-from-user-management/artisanModel";

export class ArtisanEventsHandler {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  async setupSubscriptions() {
    // Subscribe to artisan_events channel
    const artisanSub = await this.eventBus.subscribe(
      "artisan_events",
      async (event: any) => {
        console.log(
          `[search-and-discovery] Received artisan_events: ${event.eventName}`,
        );
        switch (event.eventName) {
          case "ArtisanCreated":
          case "ArtisanCreatedEvent":
            await this.handleArtisanCreated(event);
            break;
          case "ArtisanUpdated":
            await this.handleArtisanUpdated(event);
            break;
          //case "ArtisanRated":
          //  await this.handleArtisanRated(event);
          //  break;
          default:
            console.log(
              `[service-management] Unhandled 
        artisan event: ${event.eventName}`,
            );
        }
      },
    );
    this.subscriptions.push(artisanSub);

    // Also subscribe to user_events to catch artisan registrations
    const userSub = await this.eventBus.subscribe(
      "user_events",
      async (event: any) => {
        console.log(
          `[search-and-discovery] Received user_events: ${event.eventName}`,
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
      "Search-And-Discovery: Subscribed to artisan_events and user_events",
    );
  }

  async cleanup() {
    await Promise.all(this.subscriptions.map((sub) => sub.unsubscribe()));
    this.subscriptions = [];
  }

  private async handleArtisanCreated(event: any) {
    try {
      const { userId, fullName, skills, businessName, location, rating } =
        event.payload;

      await ArtisanModel.findOneAndUpdate(
        { _id: userId },
        { fullName, skillSet: skills, businessName, location, rating },
        { upsert: true, new: true },
      );

      console.log(`✅ Artisan synced to service-management DB: ${userId}`);

      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.id, "processed", "service-management"),
      );
    } catch (error: any) {
      console.error("Failed to handle ArtisanCreated:", error.message);
      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.id, "failed", "service-management", error.message),
      );
    }
  }

  private async handleUserCreatedForArtisan(event: any) {
    try {
      const { userId, fullName, additionalData } = event.payload;

      // Only process artisan registrations
      if (event.payload.role !== "ARTISAN") return;

      await ArtisanModel.findOneAndUpdate(
        { _id: userId },
        {
          fullName,
          skillSet: additionalData?.skills || [],
          businessName: additionalData?.businessName || "",
        },
        { upsert: true, new: true },
      );

      console.log(`✅ Artisan synced from user_events: ${userId}`);
    } catch (error: any) {
      console.error("Failed to handle UserCreated for artisan:", error.message);
    }
  }

  private async handleArtisanUpdated(event: any) {
    try {
      const { userId, fullName, businessName, location, skills, categories } =
        event.payload;
      const updated = await ArtisanModel.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            fullName,
            businessName,
            location,
            skillSet: skills, // this is what fixes the empty skillSet
            categories,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }, // upsert in case artisan wasn't synced before
      );
      console.log(`✅ Artisan updated in search-and-discovery DB: ${userId}`, {
        skillSet: updated?.skillSet,
      });
    } catch (error: any) {
      console.error("handleArtisanUpdated failed:", error.message);
    }
  }
}
