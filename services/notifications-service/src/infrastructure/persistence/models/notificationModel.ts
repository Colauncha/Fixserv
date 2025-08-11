import mongoose, { Document, Schema } from "mongoose";

export interface INotificationDocument extends Document {
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  status: "read" | "unread";
  createdAt: Date;
  readAt?: Date;
  updatedAt: Date;
}

export interface INotificationPreferenceDocument extends Document {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  categories: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    // id: {
    // type: String,
    // required: true,
    // unique: true,
    // index: true,
    // },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "USER_CREATED",
        "REVIEW_CREATED",
        "REVIEW_PUBLISHED",
        "BOOKING_CONFIRMED",
        "BOOKING_CANCELLED",
        "PAYMENT_PROCESSED",
        "SERVICE_CREATED",
        "WALLET_TOPUP",
        "SYSTEM_ALERT",
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["read", "unread"],
      default: "unread",
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ createdAt: 1 }); // For cleanup/archiving

const NotificationPreferenceSchema =
  new Schema<INotificationPreferenceDocument>(
    {
      userId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      emailEnabled: {
        type: Boolean,
        default: true,
      },
      pushEnabled: {
        type: Boolean,
        default: true,
      },
      smsEnabled: {
        type: Boolean,
        default: false,
      },
      categories: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    {
      timestamps: true,
      collection: "notification_preferences",
    }
  );

export const NotificationModel = mongoose.model<INotificationDocument>(
  "Notification",
  NotificationSchema
);
export const NotificationPreferenceModel =
  mongoose.model<INotificationPreferenceDocument>(
    "NotificationPreference",
    NotificationPreferenceSchema
  );
