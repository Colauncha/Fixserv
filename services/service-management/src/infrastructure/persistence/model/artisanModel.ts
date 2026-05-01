import mongoose from "mongoose";

const artisanSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  fullName: String,
  skills: [String],
  businessName: String,
  location: String,
  rating: Number,
});

const ArtisanModel = mongoose.model("Artisan", artisanSchema);
