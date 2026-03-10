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
import { WalletEventsHandler } from "./events/handlers/walletEventsHandler";

if (!process.env.JWT_KEY) throw new Error("JWT_KEY must be defined");
if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be defined");
if (!process.env.REDIS_URL) throw new Error("REDIS_URL must be defined");

const start = async (): Promise<void> => {
  console.log("🚀 Starting wallet service...");

  // 1. Connect to MongoDB
  await connectDB();

  // 2. Connect Redis cache client (for rate limiting, caching etc.)
  await connectRedis();

  // 3. Connect Event Bus (uses its OWN 2 dedicated clients - publisher + subscriber)
  const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  await eventBus.connect();

  // 4. Setup event subscriptions
  try {
    const walletEventsHandler = new WalletEventsHandler(eventBus);
    await walletEventsHandler.setupSubscriptions();
    console.log("📡 Event handlers initialized");
  } catch (eventError) {
    // Non-fatal: log and continue — events can recover, don't crash the service
    console.error("⚠️ Event handler setup failed:", eventError);
  }

  // 5. Start HTTP server AFTER all connections are ready
  const server = app.listen(4005, () => {
    console.log("✅ wallet-service running on port 4005");
  });

  // 6. Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`📴 ${signal} received, shutting down...`);
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
