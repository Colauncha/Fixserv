import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import { connectDB } from "@fixserv-colauncha/shared";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be available");
}

connectDB()
  .then(() => {
    app.listen(4003, () => {
      console.log("search service is running on port 4003");
    });
  })
  .catch((error: any) => {
    console.error("Failed to conect to database", error);
  });
