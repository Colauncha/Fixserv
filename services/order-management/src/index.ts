import dotenv from "dotenv";
dotenv.config();

import app from "./interfaces/http/expressApp";
import {
  connectDB,
  disconnectDB,
  connectRedis,
  disconnectRedis,
  RedisEventBus,
} from "@fixserv-colauncha/shared";
import { OrderEventsHandler } from "./events/handlers/orderEventHandler";

if (!process.env.JWT_KEY) throw new Error("JWT_KEY must be defined");
if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be defined");
if (!process.env.REDIS_URL) throw new Error("REDIS_URL must be defined");

const start = async (): Promise<void> => {
  console.log("🚀 Starting order-management service...");

  await connectDB();
  await connectRedis();

  // Start HTTP server immediately — don't wait for event bus
  const server = app.listen(4004, () => {
    console.log("✅ order-management running on port 4004");
  });

  // Event bus is non-fatal — retry in background
  const initEventBus = async () => {
    try {
      const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
      await eventBus.connect();
      const orderEventsHandler = new OrderEventsHandler(eventBus);
      await orderEventsHandler.setupSubscriptions();
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
  console.error("order management:", err);
  process.exit(1);
});
