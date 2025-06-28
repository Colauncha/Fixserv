import { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  fullName: string;
  password: string;
  role: "CLIENT" | "ARTISAN" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
}
