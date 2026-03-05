import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import {
  connectDB,
  disconnectDB,
  RedisEventBus,
  disconnectRedis,
} from "@fixserv-colauncha/shared";

import { ServiceEventsHandler } from "./events/handlers/serviceEventHandler";
import { ReviewEventsHandler } from "./events/handlers/reviewEventHandler";

import { connectRedis } from "@fixserv-colauncha/shared";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be available");
}
if (!process.env.REDIS_URL) throw new Error("REDIS_URL must be defined");

// const start = async (): Promise<void> => {
const start = async () => {
  await connectDB();

  await connectRedis();

  // CREATE A SINGLE EVENT BUS INSTANCE
  const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  await eventBus.connect();
  try {
    console.log("🚀 Starting user-management service...");

    const eventsHandler = new ServiceEventsHandler(eventBus);
    const reviewEventHandler = new ReviewEventsHandler(eventBus);
    await eventsHandler.setupSubscriptions();
    await reviewEventHandler.setupSubscriptions();

    console.log("📡 Event handlers initialized successfully");
  } catch (eventError) {
    console.error("⚠️ Event handler setup failed:", eventError);
    // Don't exit, continue without events if Redis is the issue
  }

  const server = app.listen(4000, () => {
    console.log("✅ user-management service running on port 4000");
  });

  // 6. Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`📴 ${signal} received, shutting //down...`);
    server.close(async () => {
      await Promise.all([
        disconnectDB(),
        disconnectRedis(),
        eventBus.disconnect(),
      ]);
      console.log("✅ Graceful shutdown complete");
      process.exit(0);
    });

    // Force exit if shutdown hangs
    setTimeout(() => {
      console.error("⚡ Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("uncaughtException", (err) => {
  console.error("💀 Uncaught Exception:", err.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("💀 Unhandled Rejection:", reason);
  process.exit(1);
});

start().catch((error) => {
  console.error("💀 Startup failed:", error);
  process.exit(1);
});
