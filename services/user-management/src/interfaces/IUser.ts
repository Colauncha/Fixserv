import { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  fullName: string;
  password: string;
  role: "CLIENT" | "ARTISAN" | "ADMIN";
  phoneNumber: string;
  profilePicture?: string; // Optional field for profile picture URL
  createdAt: Date;
  updatedAt: Date;
}
