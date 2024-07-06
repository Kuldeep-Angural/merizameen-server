import mongoose, { Model, Schema } from "mongoose";
import property from "./post.js";

const likesSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, max: 9999 },
    sellerId:{ type: Schema.Types.ObjectId, required: true, max: 9999 },
    property: { type: Schema.Types.ObjectId, ref: property, required: true },
    userName:{type:String, required: true, max: 9999},
    likedAt: { type: Date, default: Date.now },
});

const propertyLikes = mongoose.model('propertyLikes',likesSchema);
export default propertyLikes;
