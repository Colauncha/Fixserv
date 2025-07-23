import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import {
  connectDB,
  connectRedis,
  rateLimiter,
} from "@fixserv-colauncha/shared";
import { ReviewEventsHandler } from "./events/handlers/reviewEventHandler";
import { RatingCalculator } from "./domain/services/ratingCalculator";
import { reviewAndFeedbackRepositoryImpls } from "./infrastructure/review-and-feedbackRepositoryImpls";
import { UserManagementClient } from "./infrastructure/clients/userManagementClient";
import { createAxiosClient } from "./interfaces/http/axiosClient";
import { ServiceManagementClient } from "./infrastructure/clients/serviceManagementClient";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be available");
}

const userManagementClient = new UserManagementClient(
  createAxiosClient(process.env.USER_MANAGEMENT_URL!)
);

const serviceManagementClient = new ServiceManagementClient(
  createAxiosClient(process.env.SERVICE_MANAGEMENT_URL!)
);

const reviewRepo = new reviewAndFeedbackRepositoryImpls();
const ratingCalculator = new RatingCalculator(reviewRepo);

const start = async () => {
  try {
    await connectDB();
    await connectRedis();
    app.use(rateLimiter());
    app.listen(4002, () => {
      console.log("review-service is running on port 4002");
    });
    const reviewEventsHandler = new ReviewEventsHandler(
      ratingCalculator,
      userManagementClient,
      serviceManagementClient
    );

    await reviewEventsHandler.setupSubscriptions();
  } catch (error) {
    console.log(error);
  }
};

// start();
