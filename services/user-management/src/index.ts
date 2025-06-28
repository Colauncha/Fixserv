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
  throw new Error("MongoDb connection string must be available");
}

const start = async () => {
  try {
    await connectDB();
    await connectRedis();
    app.use(rateLimiter());
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

// start();
