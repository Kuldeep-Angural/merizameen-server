import { ObjectId, Timestamp } from "mongodb";
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  name: {
    type: String,
    max: 32,
    required: true,
    min: 6,
  },

  mobile: {
    type: String,
    max: 32,
    min: 6,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    max: 32,
  },

  password: {
    type: String,
    max: 1022,
    min: 8,
    required: true,
  },

  roles: {
    type: [String],
    enum: ["user", "seller", "admin", "owner"],
    default: ["user"],
  },

  refreshToken: {
    type: String,
    max: 898898898,
  },

  createdAt: {
    type: Date,
  },

  isGoogleSignUp:{
    type :Boolean,
    default:false,
  },

  profilePic:{
    type:String,
    required:false
  },

  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  
});

export default mongoose.model("user", userSchema);
