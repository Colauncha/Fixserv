import dotenv from "dotenv";
dotenv.config();

import app from "./interfaces/http/expressApp";
import {
  connectDB,
  connectRedis,
  rateLimiter,
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

const start = async () => {
  try {
    await connectDB();
    await connectRedis();

    app.use(rateLimiter());

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
      eventBus
    );

    // Setup event handlers
    const notificationEventHandler = new NotificationEventHandler(
      notificationService
    );
    await notificationEventHandler.setupSubscriptions();

    console.log("✅ Notification event handlers initialized");
  } catch (error) {
    console.log(error);
  }
};

start();
