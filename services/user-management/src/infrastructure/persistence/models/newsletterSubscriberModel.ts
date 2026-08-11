import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const NewsletterSubscriberSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => uuidv4(), unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: { type: String, default: "" },
    // Is this a registered user or just a visitor who subscribed?
    userId: { type: String, default: null },
    role: {
      type: String,
      enum: ["CLIENT", "ARTISAN", "VISITOR"],
      default: "VISITOR",
    },
    isActive: { type: Boolean, default: true, index: true },
    // Unsubscribe token — unique per subscriber, used in email unsubscribe link
    unsubscribeToken: { type: String, default: () => uuidv4(), unique: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

NewsletterSubscriberSchema.index({ isActivel: 1, subscribedAt: -1 });
NewsletterSubscriberSchema.index({ userId: 1 });

export const NewsletterSubscriberModel = mongoose.model(
  "NewsletterSubscriber",
  NewsletterSubscriberSchema,
);
