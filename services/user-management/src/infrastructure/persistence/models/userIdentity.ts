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

userIdentitySchema.index({ email: 1, role: 1 });

const UserIdentityModel = mongoose.model("UserIdentity", userIdentitySchema);

export { UserIdentityModel };
