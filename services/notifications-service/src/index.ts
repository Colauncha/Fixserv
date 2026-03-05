import dotenv from "dotenv";
dotenv.config();

import app from "./interfaces/http/expressApp";
import {
  connectDB,
  connectRedis,
  disconnectRedis,
  disconnectDB,
} from "@fixserv-colauncha/shared";
import { NotificationEventHandler } from "./events/handlers/notificationEventHandler";
import { NotificationService } from "./application/services/notificationService";
import { NotificationRepositoryImpl } from "./infrastructure/persistence/notificationRepositoryImpl";
import { NotificationDomainService } from "./application/services/notificationDomainService";
import { RedisEventBus } from "@fixserv-colauncha/shared";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be available");
}
/*
const start = async () => {
  try {
    await connectDB();
    await connectRedis();

    app.listen(4006, () => {
      console.log("notifications-service is running on port 4006");
    });

    // Initialize notification service for event handling
    const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
    const notificationRepo = new NotificationRepositoryImpl();
    const domainService = new NotificationDomainService();
    const notificationService = new NotificationService(
      notificationRepo,
      domainService,
      eventBus,
    );

    // Setup event handlers
    const notificationEventHandler = new NotificationEventHandler(
      notificationService,
    );
    await notificationEventHandler.setupSubscriptions();

    console.log("✅ Notification event handlers initialized");
  } catch (error) {
    console.log(error);
  }
};
*/

const start = async () => {
  await connectDB();

  await connectRedis();

  // CREATE A SINGLE EVENT BUS INSTANCE
  const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  await eventBus.connect();
  try {
    const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
    const notificationRepo = new NotificationRepositoryImpl();
    const domainService = new NotificationDomainService();
    const notificationService = new NotificationService(
      notificationRepo,
      domainService,
      eventBus,
    );
    const notificationEventHandler = new NotificationEventHandler(
      notificationService,
    );
    await notificationEventHandler.setupSubscriptions();
    console.log("✅ Notification event handlers initialized");
  } catch (eventError) {
    console.error("⚠️ Event handler setup failed:", eventError);
    // Don't exit, continue without events if Redis is the issue
  }

  const server = app.listen(4006, () => {
    console.log("✅ notifications-service is running on port 4006");
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

start();
