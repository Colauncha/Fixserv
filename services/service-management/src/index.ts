import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import { connectDB } from "@fixserv-colauncha/shared";
import { ArtisanEventsHandler } from "./events/handlers/artisanEventHandler";
import { ReviewEventsHandler } from "./events/handlers/reviewEventHandler";
import { connectRedis, rateLimiter } from "@fixserv-colauncha/shared";
import { OrderEventHandler } from "./events/handlers/orderEventsHandler";

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

    // app.use(rateLimiter())

    const server = app.listen(4001, () => {
      console.log("service-management is running on port 4001");
    });

    const artisanEventsHandler = new ArtisanEventsHandler();
    const reviewEventHandler = new ReviewEventsHandler();
    const orderEventHandler = new OrderEventHandler();
    await artisanEventsHandler.setupSubscriptions();
    await reviewEventHandler.setupSubscriptions();
    await orderEventHandler.setupSubscriptions();

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
  } catch (error) {
    console.log(error);
  }
};

start().catch(() => {
  console.log("Startup Server failed");
});
