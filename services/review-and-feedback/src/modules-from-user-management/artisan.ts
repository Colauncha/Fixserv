import mongoose, { Schema } from "mongoose";
import { IArtisan } from "../modules-from-user-management/IArtisan";
import { v4 as uuidv4 } from "uuid";

const artisanSchema = new mongoose.Schema<IArtisan>(
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
      default: "ARTISAN",
    },
    businessName: String,
    location: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    skillSet: {
      type: [String],
      default: ["General repair"],
    },
    businessHours: Schema.Types.Mixed,
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

const ArtisanModel = mongoose.model<IArtisan>("ArtisanModel", artisanSchema);

export { ArtisanModel };
