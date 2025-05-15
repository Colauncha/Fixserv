import mongoose from "mongoose";
import { feedbackSchema } from "./feedback";
import { ratingSchema } from "./rating";
import { v4 as uuidv4 } from "uuid";
export const reviewSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    orderId: {
      type: String,
      required: true,
      default: uuidv4,
    },
    artisanId: {
      type: String,
      required: true,
      ref: "ArtisanModel",
    },
    clientId: {
      type: String,
      required: true,
      ref: "ClientModel",
    },
    serviceId: {
      type: String,
      required: true,
      ref: "ServiceModel",
    },
    feedback: { type: feedbackSchema, required: true },
    artisanRating: { type: ratingSchema, required: true },
    serviceRating: { type: ratingSchema, required: true },
    status: {
      type: String,
      enum: ["pending", "published", "flagged"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;

        ret.comment = ret.feedback.comment;
        ret.moderationNotes = ret.feedback.moderationNotes;
        ret.attachments = ret.feedback.attachments;
        delete ret.feedback;

        ret.ratingDimensions = ret.artisanRating.dimensions;

        ret.artisanRating = ret.artisanRating.value;
        ret.serviceRating = ret.serviceRating.value;

        ret.date = ret.createdAt;
        delete ret.createdAt;
      },
    },
  }
);

export const ReviewModel = mongoose.model("ReviewModel", reviewSchema);
