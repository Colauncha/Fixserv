import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import { connectDB } from "@fixserv-colauncha/shared";

import { ServiceEventsHandler } from "./events/handlers/serviceEventHandler";
import { ReviewEventsHandler } from "./events/handlers/reviewEventHandler";

import { connectRedis, rateLimiter } from "@fixserv-colauncha/shared";

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be //available");
}

const start = async () => {
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
