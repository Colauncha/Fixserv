import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import {
  connectDB,
  connectRedis,
  rateLimiter,
} from "@fixserv-colauncha/shared";
import { WalletEventsHandler } from "./events/handlers/walletEventsHandler";

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
