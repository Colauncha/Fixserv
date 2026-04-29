import mongoose from "mongoose";

const artisanSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  fullName: String,
  skills: [String],
  businessName: String,
});

export const ArtisanModel = mongoose.model("ArtisanModel", artisanSchema);
