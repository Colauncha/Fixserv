import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import { connectDB } from "@fixserv-colauncha/shared";
import { ArtisanEventsHandler } from "./events/handlers/artisanEventHandler";
import { ReviewEventHandler } from "./events/handlers/reviewEventHandler";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be available");
}

connectDB()
  .then(() => {
    app.listen(4001, () => {
      console.log("service-management is running on port 4001");
    });
  })
  .catch((error: any) => {
    console.error("Failed to conect to database", error);
  });

const artisanEventsHandler = new ArtisanEventsHandler();
const reviewEventHandler = new ReviewEventHandler();
artisanEventsHandler.setupSubscriptions().catch(console.error);
reviewEventHandler.setupSubscriptions().catch(console.error);
