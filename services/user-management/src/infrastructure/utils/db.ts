import mongoose from "mongoose";
import { DatabaseConnectionError } from "../../errors/databaseConnectionError";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(
      "mongodb://user-service-mongo-srv:27017/user-service"
    );

    //await mongoose.connect(process.env.MONGO_URI!);

    console.log("Connected to database");
  } catch (error) {
    throw new DatabaseConnectionError();
    process.exit(1);
  }
};

export default connectToDatabase;
