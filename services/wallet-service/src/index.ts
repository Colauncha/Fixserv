import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import {
  connectDB,
  connectRedis,
  disconnectDB,
  rateLimiter,
} from "@fixserv-colauncha/shared";
import { WalletEventsHandler } from "./events/handlers/walletEventsHandler";

/*
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
    // app.use(rateLimiter());

    app.listen(4005, () => {
      console.log("wallet-service is running on port 4005");
    });
    const walletEventsHandler = new WalletEventsHandler();
    await walletEventsHandler.setupSubscriptions();
  } catch (error) {
    console.log(error);
  }
};

start();
*/

// Global state to prevent crashes
//let server: any = null;
let walletEventsHandler: WalletEventsHandler | null = null;
let isShuttingDown = false;
//let serviceStartTime = Date.now();

//const cleanup = async (): Promise<void> => {
//  console.log("🧹 Starting graceful shutdown...");
//  try {
//    await disconnectDB();
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

// Error handling
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

// Only exit on explicit shutdown signals
//const gracefulShutdown = async (signal: string): Promise<void> => {
//  if (isShuttingDown) return;
//  isShuttingDown = true;
//
//  console.log(`🛑 Received ${signal}, starting graceful shutdown...`);
//
//  try {
//    if (server) {
//      await new Promise<void>((resolve) => {
//        server.close(() => {
//          console.log("🚪 HTTP server closed");
//          resolve();
//        });
//      });
//    }
//
//    await disconnectDB();
//    console.log("✅ Graceful shutdown completed");
//  } catch (error) {
//    console.error("❌ Error during shutdown:", error);
//  }
//
//  process.exit(0);
//};
//
//process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
//process.on("SIGINT", () => gracefulShutdown("SIGINT"));

const start = async (): Promise<void> => {
  // let server: any;
  console.log("🚀 Starting wallet service...");

  // serviceStartTime = Date.now();

  // Connect to MongoDB
  try {
    console.log("📦 Connecting to MongoDB...");
    await connectDB();

    await connectRedis();

    const server = app.listen(4005, () => {
      console.log("✅ wallet-service is running on port 4005");
      console.log(`🕒 Service started at: ${new Date().toISOString()}`);
    });

    // Setup event handlers
    console.log("📡 Setting up event handlers...");
    try {
      const walletEventsHandler = new WalletEventsHandler();
      await walletEventsHandler.setupSubscriptions();
      console.log("📡 Event handlers initialized successfully");
    } catch (eventError) {
      console.error("⚠️ Event handler setup failed:", eventError);
    }

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`📴 Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        console.log("✅ HTTP server closed");
        await connectDB();
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
  } catch (error: any) {
    console.error(
      "❌ MongoDB connection failed, but service will continue:",
      error
    );
    const server = app.listen(4005, () => {
      console.log(`⚠️ Server running in degraded mode on 4005 ${4005}`);
      console.log("🔄 Database reconnection will be attempted automatically");
    });
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
      // console.log(
      // `🔓 Bypassing rate limit for internal service: ${
      // req.hostname || req.ip
      // }`
      // );
      // return next();
      console.log(
        `🔓 Internal request: ${req.method} ${req.url} from ${
          req.hostname || req.ip
        }`
      );
      return next();
    }
  });
  //
  //  // Apply rate limiting for external requests
  //  // return rateLimiter()(req, res, next);
  //  return next();
  //});

  // Handle graceful shutdown
  //const gracefulShutdown = async (signal: string): Promise<void> => {
  //  console.log(`🛑 Received ${signal}, starting graceful shutdown...`);
  //  if (server) {
  //    server.close(async () => {
  //      console.log("🚪 HTTP server closed");
  //      await cleanup();
  //      process.exit(0);
  //    });
  //
  //    // Force close after 10 seconds
  //    setTimeout(() => {
  //      console.log("⏰ Force closing due to timeout");
  //      process.exit(1);
  //    }, 10000);
  //  } else {
  //    await cleanup();
  //    process.exit(0);
  //  }
  //};

  //process.on("SIGTERM", () => gracefulShutdown//("SIGTERM"));
  //process.on("SIGINT", () => gracefulShutdown//("SIGINT"));
  //};
};

start().catch(async (error) => {
  console.error("💀 Startup failed:", error);
});
