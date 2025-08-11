import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const feedbackSchema = new mongoose.Schema(
  {
    comment: { type: String, maxLength: 500, required: true },
    moderationNotes: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
  },
  { _id: false }
);
