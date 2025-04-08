import mongoose from "mongoose";
import { IClient } from "../../../interfaces/IClient";
import { v4 as uuidv4 } from "uuid";

const clientSchema = new mongoose.Schema<IClient>({
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
    default: "CLIENT",
  },
  deliveryAddress: {
    street: String,
    city: String,
    postalCode: String,
    state: String,
    country: String,
  },
  // servicePreferences: {
  //   type: [String],
  //   enum: ["phone-repair", "laptop-repair", "home-appliances"],
  // },
  servicePreferences: [
    {
      categories: [String],
    },
  ],
},{
  toJSON: {
    transform(doc, ret) {
      ret.id=ret._id
      delete ret._id
      delete ret.__v
    },
  },
});

const ClientModel = mongoose.model<IClient>("ClientModel", clientSchema);

export { ClientModel };
