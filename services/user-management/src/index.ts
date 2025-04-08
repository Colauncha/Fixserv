import dotenv from "dotenv";
dotenv.config();
import app from "./interfaces/http/expressApp";
import connectToDatabase from "./infrastructure/utils/db";

if (!process.env.JWT_KEY) {
  throw new Error("JWT SECRET must be defined");
}
if (!process.env.MONGO_URI) {
  throw new Error("MongoDb connection string must be available");
}

connectToDatabase()
  .then(() => {
    app.listen(4000, () => {
      console.log("user service is running on port 4000");
    });
  })
  .catch((error) => {
    console.error("Failed to conect to database", error);
  });
