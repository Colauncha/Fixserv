import mongoose, { Schema } from "mongoose";
import { IArtisan } from "../../../interfaces/IArtisan";
import { v4 as uuidv4 } from "uuid";

// Certificate sub-schema
const certificateSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["IMAGE", "PDF"],
      required: true,
    },
    uploadedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      required: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: String, // Admin ID
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

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
    categories: [
      {
        name: { type: String, required: true, uppercase: true },
        description: { type: String, default: "" },
        iconUrl: { type: String, default: null },
      },
    ],
    certificates: {
      type: [certificateSchema],
      default: [],
      validate: {
        validator: function (certs: any[]) {
          return certs.length <= 10; // Limit to 10 certificates per artisan
        },
        message: "An artisan can have a maximum of 10 certificates",
      },
    },
    profilePicture: {
      type: String,
      default: null,
    },
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
  } as any,
  {
    toJSON: {
      transform(doc, ret: any) {
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
      transform(doc, ret: any) {
        delete ret.password;
      },
    },
  },
);
// Add indexes for performance:
artisanSchema.index({ role: 1, "categories.name": 1 });
artisanSchema.index({ role: 1, "categories.name": 1, location: 1 });

artisanSchema.index({ "certificates.status": 1 });
artisanSchema.index({
  "certificates.status": 1,
  "certificates.uploadedAt": -1,
});

const ArtisanModel = mongoose.model<IArtisan>("ArtisanModel", artisanSchema);

export { ArtisanModel };
