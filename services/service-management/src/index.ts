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

    app.use(rateLimiter());

    app.listen(4001, () => {
      console.log("service-management is running on port 4001");
    });

    const artisanEventsHandler = new ArtisanEventsHandler();
    const reviewEventHandler = new ReviewEventsHandler();
    const orderEventHandler = new OrderEventHandler();
    await artisanEventsHandler.setupSubscriptions();
    await reviewEventHandler.setupSubscriptions();
    await orderEventHandler.setupSubscriptions();
  } catch (error) {
    console.log(error);
  }
};

start();
