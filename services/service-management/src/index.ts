import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import {
  connectDB,
  disconnectRedis,
  disconnectDB,
  RedisEventBus,
} from "@fixserv-colauncha/shared";
import { ArtisanEventsHandler } from "./events/handlers/artisanEventHandler";
import { ReviewEventsHandler } from "./events/handlers/reviewEventHandler";
import { connectRedis } from "@fixserv-colauncha/shared";
import { OrderEventHandler } from "./events/handlers/orderEventsHandler";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be available");
}

const start = async (): Promise<void> => {
  console.log("🚀 Starting service-management service...");

  await connectDB();
  await connectRedis();

  // Start HTTP server immediately — don't wait for event bus
  const server = app.listen(4001, () => {
    console.log("✅ service-management running on port 4001");
  });

  // Event bus is non-fatal — retry in background
  const initEventBus = async () => {
    try {
      const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
      await eventBus.connect();
      const artisanEventsHandler = new ArtisanEventsHandler();
      const reviewEventHandler = new ReviewEventsHandler();
      const orderEventHandler = new OrderEventHandler();
      await artisanEventsHandler.setupSubscriptions();
      await reviewEventHandler.setupSubscriptions();
      await orderEventHandler.setupSubscriptions();
      console.log("📡 Event handlers initialized");
    } catch (eventError: any) {
      console.error(
        "⚠️ Event bus failed, retrying in 10s:",
        eventError.message,
      );
      setTimeout(initEventBus, 10000); // retry after 10s
    }
  };

  initEventBus(); // fire and forget — server already running

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
  console.error("💀 Failed to start service management:", err);
  process.exit(1);
});
