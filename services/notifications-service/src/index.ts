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

const start = async (): Promise<void> => {
  console.log("🚀 Starting notifications service...");

  await connectDB();
  await connectRedis();

  // Start HTTP server immediately — don't wait for event bus
  const server = app.listen(4006, () => {
    console.log("✅ notifications-service is running on port 4006");
  });

  // Event bus is non-fatal — retry in background
  const initEventBus = async () => {
    try {
      const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
      await eventBus.connect();
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
  console.error("notifications service:", err);
  process.exit(1);
});
