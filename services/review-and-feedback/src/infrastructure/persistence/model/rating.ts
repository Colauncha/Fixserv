import mongoose from "mongoose";
export const ratingSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    dimensions: {
      quality: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
    },
  },
  { _id: false }
);

