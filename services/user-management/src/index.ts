import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import { connectDB } from "@fixserv-colauncha/shared";

import { ServiceEventsHandler } from "./events/handlers/serviceEventHandler";
import { ReviewEventsHandler } from "./events/handlers/reviewEventHandler";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be available");
}

connectDB()
  .then(() => {
    app.listen(4000, () => {
      console.log("user-management is running on port 4000");
    });
  })
  .catch((error: any) => {
    console.error("Failed to conect to database", error);
  });

const eventsHandler = new ServiceEventsHandler();
const reviewEventHandler = new ReviewEventsHandler();
eventsHandler.setupSubscriptions().catch(console.error);
reviewEventHandler.setupSubscriptions().catch(console.error);
