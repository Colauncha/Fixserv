import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const ActivityLogSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => uuidv4(), index: true },
    action: { type: String, required: true, index: true },
    actorId: { type: String, required: true, index: true },
    actorRole: {
      type: String,
      enum: ["CLIENT", "ARTISAN", "ADMIN"],
      required: true,
    },
    targetId: { type: String, index: true },
    targetType: { type: String }, // "ORDER" | "USER" | "SERVICE" | "REVIEW"
    service: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    // Auto-delete after 90 days — keeps collection lean
    expireAfterSeconds: 60 * 60 * 24 * 90,
  },
);

// Query patterns the admin dashboard needs
ActivityLogSchema.index({ actorId: 1, timestamp: -1 });
ActivityLogSchema.index({ actorRole: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });
ActivityLogSchema.index({ service: 1, timestamp: -1 });

const ActivityLogModel = mongoose.model("ActivityLog", ActivityLogSchema);

export { ActivityLogModel };
