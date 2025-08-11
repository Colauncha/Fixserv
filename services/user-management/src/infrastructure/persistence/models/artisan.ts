import mongoose, { Schema } from "mongoose";
import { IArtisan } from "../../../interfaces/IArtisan";
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
      select: false,
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
        if (ret._user) {
          if (ret._user?.password) {
            delete ret._user.password;
          }
        }
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
      },
    },
  }
);

const ArtisanModel = mongoose.model<IArtisan>("ArtisanModel", artisanSchema);

export { ArtisanModel };
