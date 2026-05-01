import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import {
  connectDB,
  connectRedis,
  RedisEventBus,
  disconnectDB,
  disconnectRedis,
} from "@fixserv-colauncha/shared";

import { ArtisanEventsHandler } from "./events/handlers/artisanEventHandler";
import { ServiceEventsHandler } from "./events/handlers/serviceEventHandler";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDB connection string must be available");
}

if (!process.env.REDIS_URL) throw new Error("REDIS_URL must be defined");

const start = async (): Promise<void> => {
  console.log("🚀 Starting search and discovery service...");

  await connectDB();
  await connectRedis();

  const server = app.listen(4003, () => {
    console.log("search service is running on port 4003");
  });
  // Event bus is non-fatal — retry in background
  const initEventBus = async () => {
    try {
      const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
      await eventBus.connect();
      const artisanEventsHandler = new ArtisanEventsHandler();
      const serviceEventsHandler = new ServiceEventsHandler(eventBus);
      await artisanEventsHandler.setupSubscriptions();
      await serviceEventsHandler.setupSubscriptions();
      console.log("📡 Event handlers initialized");
    } catch (eventError: any) {
      console.error(
        "⚠️ Event bus failed, retrying in 10s:",
        eventError.message,
      );
      setTimeout(initEventBus, 10000); // retry after 10s
    }
  };

  initEventBus();

  const shutdown = async (signal: string) => {
    console.log(`📴 ${signal} received, shutting down...`);
    server.close(async () => {
      await Promise.all([
        disconnectDB(),
        disconnectRedis(),
        RedisEventBus.instanceRef?.disconnect(),
      ]);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((err) => {
  console.error("💀 Failed to start wallet service:", err);
  process.exit(1);
});
