import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import { connectDB, connectRedis } from "@fixserv-colauncha/shared";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDB connection string must be available");
}

const start = async (): Promise<void> => {
  console.log("🚀 Starting search and discovery service...");

  await connectDB();

  // Start HTTP server immediately — don't wait for event bus
  const server = app.listen(4003, () => {
    console.log("search service is running on port 4003");
  });
};

start().catch((err) => {
  console.error("search and discovery service:", err);
  process.exit(1);
});
