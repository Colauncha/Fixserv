import mongoose from "mongoose";
import { IClient } from "../../../interfaces/IClient";
import { v4 as uuidv4 } from "uuid";

const clientSchema = new mongoose.Schema<IClient>(
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
      default: "CLIENT",
    },
    deliveryAddress: {
      street: String,
      city: String,
      postalCode: String,
      state: String,
      country: String,
    },
    servicePreferences: {
      type: [String],
      required: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    uploadedProducts: [
      {
        id: { type: String, required: true },
        imageUrl: String,
        description: String,
        objectName: String,
        uploadedAt: Date,
      },
    ],
    phoneNumber: {
      type: String,
      required: true,
    },
    // ADD EMAIL VERIFICATION FIELDS
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    // Optional: Add timestamps for verification
    emailVerifiedAt: {
      type: Date,
      default: null,
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

const ClientModel = mongoose.model<IClient>("ClientModel", clientSchema);

export { ClientModel };
