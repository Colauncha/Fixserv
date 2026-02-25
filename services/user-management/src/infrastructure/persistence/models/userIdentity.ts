import mongoose from "mongoose";
const userIdentitySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
});

const UserIdentityModel = mongoose.model("UserIdentity", userIdentitySchema);

export { UserIdentityModel };
