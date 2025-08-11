import mongoose from "mongoose";
import { IAdmin } from "../../../interfaces/IAdmin";
import { v4 as uuidv4 } from "uuid";

const adminSchema = new mongoose.Schema<IAdmin>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "ADMIN",
    },
    permissions: [String],
    profilePicture: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const AdminModel = mongoose.model<IAdmin>("AdminModel", adminSchema);

export { AdminModel };
