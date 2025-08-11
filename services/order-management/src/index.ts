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

const start = async () => {
  try {
    await connectDB();
    await connectRedis();
    app.use(rateLimiter());
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
