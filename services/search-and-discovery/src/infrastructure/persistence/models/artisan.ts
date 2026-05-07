import mongoose from "mongoose";

const artisanSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String },
    fullName: String,
    businessName: String,
    location: String,
    rating: Number,
    skillSet: {
      type: [String],
    },
    categories: {
      type: [String],
    },
    role: {
      type: String,
      default: "ARTISAN",
    },
  },
  {
    autoIndex: true, // Ensure indexes are created
  },
);

// Only index what you actually query on
artisanSchema.index({ skillSet: 1 });
artisanSchema.index({ location: 1 });
artisanSchema.index({ rating: -1 });
artisanSchema.index({ fullName: "text", businessName: "text" });

export const ArtisanModel = mongoose.model("Search_Artisans", artisanSchema);
