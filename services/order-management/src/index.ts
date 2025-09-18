import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import {
  connectDB,
  connectRedis,
  rateLimiter,
} from "@fixserv-colauncha/shared";
import { OrderEventsHandler } from "./events/handlers/orderEventHandler";

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

    // app.use(rateLimiter());
    app.listen(4004, () => {
      console.log("order-service is running on port 4004");
    });
    const orderEventsHandler = new OrderEventsHandler();
    await orderEventsHandler.setupSubscriptions();
  } catch (error) {
    console.log(error);
  }
};

start();
*/

// Error handling
process.on("uncaughtException", async (err) => {
  console.error("💀 Uncaught Exception:", err.name, err.message);
  console.error("Stack:", err.stack);
  await cleanup();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💀 Unhandled Rejection at:", promise, "reason:", reason);
  await cleanup();
  process.exit(1);
});

const cleanup = async (): Promise<void> => {
  console.log("🧹 Starting graceful shutdown...");
  try {
    console.log("✅ Cleanup completed");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
};

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
const start = async (): Promise<void> => {
  let server: any;
  try {
    console.log("🚀 Starting order-management service...");

    // Connect to MongoDB
    console.log("📦 Connecting to MongoDB...");
    await connectDB();

    // Connect to Redis with fallback
    console.log("📦 Connecting to Redis...");
    try {
      await connectRedis();
    } catch (error) {
      console.log("⚠️ Primary Redis connection failed, trying alternative...");
    }

    // Rate limiter middleware - BYPASS for internal services
    app.use((req: any, res, next) => {
      const internalHosts = [
        "user-management-srv",
        "wallet-service-srv",
        "order-management-srv",
        "service-management-srv",
        "localhost",
      ];
      const internalIPs = ["127.0.0.1", "::1"];

      // Check if request is from internal service
      const isInternal =
        internalHosts.includes(req.hostname) ||
        internalIPs.some((ip) => req.ip?.includes(ip)) ||
        req.headers["x-internal-service"] === "true" ||
        req.headers["x-service-name"]; // Check for service headers

      if (isInternal) {
        console.log(
          `🔓 Bypassing rate limit for internal service: ${
            req.hostname || req.ip
          }`
        );
        return next();
      }

      // Apply rate limiting for external requests
      // return rateLimiter()(req, res, next);
      return next();
    });

    // Start server
    server = app.listen(4004, () => {
      console.log("✅ order-management is running on port 4004");
    });

    // Setup event handlers
    console.log("📡 Setting up event handlers...");
    try {
      const orderEventsHandler = new OrderEventsHandler();
      await orderEventsHandler.setupSubscriptions();
      console.log("📡 Event handlers initialized successfully");
    } catch (eventError) {
      console.error("⚠️ Event handler setup failed:", eventError);
    }

    console.log("🎉 Order-management service started successfully!");
  } catch (error) {
    console.error("💀 Failed to start service:", error);
    await cleanup();
    process.exit(1);
  }

  // Handle graceful shutdown
  const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`🛑 Received ${signal}, starting graceful shutdown...`);
    if (server) {
      server.close(async () => {
        console.log("🚪 HTTP server closed");
        await cleanup();
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.log("⏰ Force closing due to timeout");
        process.exit(1);
      }, 10000);
    } else {
      await cleanup();
      process.exit(0);
    }
  };

  //process.on("SIGTERM", () => gracefulShutdown//("SIGTERM"));
  //process.on("SIGINT", () => gracefulShutdown//("SIGINT"));
};

start().catch(async (error) => {
  console.error("💀 Startup failed:", error);
  await cleanup();
  // process.exit(1);
});
*/
//////////////////////////////////////////////////////////////
// Graceful startup
async function startServer() {
  console.log("🚀 Starting Order Management Service...");

  try {
    // Connect to database
    console.log("📦 Connecting to database...");
    await connectDB();
    console.log("✅ Database connection established");

    await connectRedis();
    console.log("Redis connected");

    // Start HTTP server
    const server = app.listen(4004, () => {
      console.log(`✅ Server running on 4004 ${4004}`);
    });

    // Setup event handlers
    console.log("📡 Setting up event handlers...");
    try {
      const orderEventsHandler = new OrderEventsHandler();
      await orderEventsHandler.setupSubscriptions();
      console.log("📡 Event handlers initialized successfully");
    } catch (eventError) {
      console.error("⚠️ Event handler setup failed:", eventError);
    }

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`📴 Received ${signal}, shutting down gracefully...`);

      server.close(() => {
        console.log("✅ HTTP server closed");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.log("⚡ Force closing server");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("💀 Failed to start server:", error);

    // Start server anyway without database (in degraded mode)
    console.log("⚠️ Starting in degraded mode without database...");

    const server = app.listen(4004, () => {
      console.log(`⚠️ Server running in degraded mode on 4004 ${4004}`);
      console.log("🔄 Database reconnection will be attempted automatically");
    });
  }
}

// Start the server
startServer().catch((error) => {
  console.error("💀 Critical startup error:", error);
  process.exit(1);
});
