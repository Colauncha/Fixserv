import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import {
  connectDB,
  connectRedis,
  rateLimiter,
  RedisEventBus,
} from "@fixserv-colauncha/shared";
import { OrderEventsHandler } from "./events/handlers/orderEventHandler";

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

  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💀 Unhandled Rejection at:", promise, "reason:", reason);

  process.exit(1);
});

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}

if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be available");
}

// Graceful startup
async function startServer() {
  const eventBus = RedisEventBus.instance(process.env.REDIS_URL);
  await eventBus.connect();

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
      const orderEventsHandler = new OrderEventsHandler(eventBus);
      await orderEventsHandler.setupSubscriptions();
      console.log("📡 Event handlers initialized successfully");
    } catch (eventError) {
      console.error("⚠️ Event handler setup failed:", eventError);
    }
  } catch (error) {
    console.error("💀 Failed to start server:", error);
  }
}

// Start the server
startServer().catch((error) => {
  console.error("💀 Critical startup error:", error);
  // process.exit(1);
});
