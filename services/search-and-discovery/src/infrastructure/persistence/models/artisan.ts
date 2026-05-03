import mongoose from "mongoose";

const artisanSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
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
});

export const ArtisanModel = mongoose.model("Search_Artisans", artisanSchema);
