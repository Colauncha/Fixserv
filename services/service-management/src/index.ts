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

const start = async () => {
  await connectDB();
  await connectRedis();
  // CREATE A SINGLE EVENT BUS INSTANCE
  const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  await eventBus.connect();
  try {
    const artisanEventsHandler = new ArtisanEventsHandler();
    const reviewEventHandler = new ReviewEventsHandler();
    const orderEventHandler = new OrderEventHandler();
    await artisanEventsHandler.setupSubscriptions();
    await reviewEventHandler.setupSubscriptions();
    await orderEventHandler.setupSubscriptions();
    console.log("📡 Event handlers initialized successfully");
  } catch (error) {
    console.error("⚠️ Event handler setup failed:", error);
  }

  const server = app.listen(4001, () => {
    console.log("service-management is running on port 4001");
  });
  // 6. Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`📴 ${signal} received, shutt down...`);
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
      console.error("⚡ Forced shutdown aftertimeout");
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
