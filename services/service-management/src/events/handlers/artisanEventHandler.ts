import { RedisEventBus } from "@fixserv-colauncha/shared";
import { EventAck } from "@fixserv-colauncha/shared";
import { ArtisanModel } from "../../infrastructure/persistence/model/artisanModel";

export class ArtisanEventsHandler {
  private eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  private subscriptions: { unsubscribe: () => Promise<void> }[] = [];

  async setupSubscriptions() {
    const artisanSub = await this.eventBus.subscribe(
      "artisan_events",
      async (event: any) => {
        console.log("Received artisan event:", event.eventName);

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
              `[service-management] Unhandled artisan event: ${event.eventName}`,
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

  private async handleArtisanUpdated(event: any) {
    try {
      const { userId, fullName, businessName, location, skills, categories } =
        event.payload;

      const updated = await ArtisanModel.findOneAndUpdate(
        { userId },
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

      console.log(`✅ Artisan updated in service-management DB: ${userId}`, {
        skillSet: updated?.skillSet,
      });
    } catch (error: any) {
      console.error("handleArtisanUpdated failed:", error.message);
    }
  }

  private async handleArtisanCreated(event: any) {
    try {
      console.log("ArtisanCreated event payload:", event.payload);

      const {
        userId,
        fullName,
        skills,
        businessName,
        location,
        rating,
        categories,
      } = event.payload;

      const result = await ArtisanModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            userId,
            fullName: fullName || "",
            skillSet: skills || [], // payload has "skills", model has "skillSet"
            businessName: businessName || "",
            location: location || "",
            rating: rating || 0,
            categories: categories || [],
          },
        },
        { upsert: true, new: true },
      );

      console.log(`✅ Artisan created in service-management DB: ${userId}`, {
        skillSet: result?.skillSet,
        categories: result?.categories,
      });

      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.id, "processed", "service-management"),
      );
    } catch (error: any) {
      console.error("handleArtisanCreated failed:", error.message);
      await this.eventBus.publish(
        "event_acks",
        new EventAck(event.id, "failed", "service-management", error.message),
      );
    }
  }

  private async handleUserCreatedForArtisan(event: any) {
    try {
      if (event.payload.role !== "ARTISAN") return;

      const { userId, fullName, additionalData } = event.payload;

      console.log("UserCreated artisan payload:", {
        userId,
        fullName,
        additionalData,
      });

      await ArtisanModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            userId,
            fullName: fullName || "",
            skillSet: additionalData?.skills || [],
            businessName: additionalData?.businessName || "",
            location: additionalData?.location || "",
            rating: 0,
            categories: additionalData?.categories || [],
          },
        },
        { upsert: true, new: true },
      );

      console.log(`✅ Artisan synced from UserCreatedEvent: ${userId}`);
    } catch (error: any) {
      console.error("handleUserCreatedForArtisan failed:", error.message);
    }
  }
}
