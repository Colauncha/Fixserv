import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import {
  connectDB,
  rateLimiter,
  connectRedis,
} from "@fixserv-colauncha/shared";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDB connection string must be available");
}

const start = async () => {
  await connectDB();
  await connectRedis();
  app.use(rateLimiter());
  app.listen(4003, () => {
    console.log("search service is running on port 4003");
  });
};

// start();
