import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import {
  connectDB,
  disconnectDB,
  RedisEventBus,
} from "@fixserv-colauncha/shared";

import { ServiceEventsHandler } from "./events/handlers/serviceEventHandler";
import { ReviewEventsHandler } from "./events/handlers/reviewEventHandler";

import { connectRedis, rateLimiter } from "@fixserv-colauncha/shared";

//process.on("uncaughtException", (err) => {
//  console.log(err.name, err.message);
//  process.exit(1);
//});

process.on("uncaughtException", async (err) => {
  console.error("💀 Uncaught Exception:", err.name, err.message);
  console.error("Stack:", err.stack);

  // await cleanup();
  // process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💀 Unhandled Rejection at:", promise, "reason:", reason);

  // await cleanup();
  // process.exit(1);
});

//const cleanup = async (): Promise<void> => {
//  console.log("🧹 Starting graceful shutdown...");
//  try {
//    await disconnectDB();
//
//    console.log("✅ Cleanup completed");
//  } catch (error) {
//    console.error("❌ Error during cleanup:", error);
//  }
//};

// Handle shutdown signals
//process.on("SIGTERM", cleanup);
//process.on("SIGINT", cleanup);

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be available");
}
/*
const start = async ():Promise<void> => {
  try {
    await connectDB();
    await connectRedis();
    // app.use(rateLimiter());
    // Apply rate limiter only for public/external requests
    app.use((req: any, res, next) => {
      // Skip limiter for internal service-to-service calls
      // In Docker, `req.hostname` or `req.ip` may be like 'user-management-srv' or internal IPs
      const internalHosts = [
        "user-management-srv",
        "wallet-service-srv",
        "service-management-srv",
      ];
      const internalIPs = ["127.0.0.1", "::1"];

      if (
        internalHosts.includes(req.hostname) ||
        internalIPs.includes(req.ip)
      ) {
        return next();
      }

      // Otherwise, apply rate limiting
      return rateLimiter()(req, res, next);
    });

    app.listen(4000, () => {
      console.log("user-management is running on port 4000");
    });

    const eventsHandler = new ServiceEventsHandler();
    const reviewEventHandler = new ReviewEventsHandler();
    await eventsHandler.setupSubscriptions();
    await reviewEventHandler.setupSubscriptions();
  } catch (error) {
    console.log(error);
  }
};

start();
*/

const start = async (): Promise<void> => {
  let server: any;

  try {
    console.log("🚀 Starting user-management service...");

    // Connect to MongoDB with retries
    console.log("📦 Connecting to MongoDB...");
    await connectDB();

    // Connect to Redis with fallback option
    console.log("📦 Connecting to Redis...");
    try {
      await connectRedis();
    } catch (error) {
      console.log("⚠️ Primary Redis connection failed, trying alternative...");
    }

    // CREATE A SINGLE EVENT BUS INSTANCE
    const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
    await eventBus.connect();

    // Rate limiter middleware (simplified to avoid Redis dependency issues)
    app.use((req: any, res, next) => {
      const internalHosts = [
        "user-management-srv",
        "wallet-service-srv",
        "service-management-srv",
        "localhost",
      ];

      const internalIPs = ["127.0.0.1", "::1"];

      // Check if request is from internal service
      const isInternal =
        internalHosts.includes(req.hostname) ||
        internalIPs.some((ip) => req.ip?.includes(ip));

      if (isInternal) {
        return next();
      }

      // For now, skip rate limiting if Redis is not available
      // You can implement in-memory rate limiting as fallback
      return next();
    });

    // Start server
    server = app.listen(4000, () => {
      console.log("✅ user-management is running on port 4000");
    });

    // Setup event handlers with error handling
    console.log("📡 Setting up event handlers...");
    try {
      const eventsHandler = new ServiceEventsHandler(eventBus);
      const reviewEventHandler = new ReviewEventsHandler(eventBus);

      await eventsHandler.setupSubscriptions();
      await reviewEventHandler.setupSubscriptions();

      console.log("📡 Event handlers initialized successfully");
    } catch (eventError) {
      console.error("⚠️ Event handler setup failed:", eventError);
      // Don't exit, continue without events if Redis is the issue
    }

    console.log("🎉 Service started successfully!");

    // Health check interval
    // setInterval(async () => {
    //   const redisHealthy = await checkRedisHealth();
    //   if (!redisHealthy) {
    //     console.warn("⚠️ Redis health check failed");
    //   }
    // }, 30000); // Check every 30 seconds
    // Graceful shutdown handling
    // const gracefulShutdown = (signal: string) => {
    //   console.log(`📴 Received ${signal}, shutting down gracefully...`);
    //   server.close(async () => {
    //     console.log("✅ HTTP server closed");
    //     await connectDB();
    //     process.exit(0);
    //   });
    //   // Force close after 10 seconds
    //   setTimeout(() => {
    //     console.log("⚡ Force closing server");
    //     process.exit(1);
    //   }, 10000);
    // };
    // process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    // process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("💀 Failed to start service:", error);

    // await cleanup();
    // process.exit(1);
  }
};

start().catch(async (error) => {
  console.error("💀 Startup failed:", error);
  // await cleanup();
  // process.exit(1);
});
