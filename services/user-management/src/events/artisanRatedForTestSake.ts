/*
import { ArtisanRatedEvent } from "./artisanRatedEvent";
import { RedisEventBus } from "@fixserv-colauncha/shared";
import { UserRepositoryImpl } from "../infrastructure/persistence/userRepositoryImpl";

export async function subscribeToArtisanRatedEvents() {
  const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  const userRepository = new UserRepositoryImpl();

  await eventBus.subscribe("artisan_events", async (event: any) => {
    if (event.eventName === "ArtisanRated") {
      const artisanRated = new ArtisanRatedEvent(event.payload);
      await userRepository.updateRating(
        artisanRated.payload.artisanId,
        artisanRated.payload.newRating
      );
    }
  });

  console.log("✅ Subscribed to ArtisanRatedEvent");
}
*/
