import mongoose, { Schema } from "mongoose";

const userToken = new Schema({
    userId: {
      type:Schema.Types.ObjectId,
      require:true,
    },
    token: {
      type:String,
      require:true,
    },
    createdAt: {
      type: Date,
      default:Date.now,
      expires:30*86400 // 30 days
    }
  });
  
  export default mongoose.model("userToken", userToken)