import mongoose, { Schema } from "mongoose";

const callRequest = new Schema({
    sellerId: {
        type: Schema.Types.ObjectId,
        require: true,
    },

    userId: {
        type: Schema.Types.ObjectId,
        require: true,
    },
    propertyId : {
        type: Schema.Types.ObjectId,
        require: true,
    },
    requestContent:{
        name:{
            type:String
            
        },
        mobile: {
            type:String
        },
        email: {
            type:String
        },
        message:{
            type:String,
            maxlength: 328989 
        }
    },
    requestedAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model("callRequest", callRequest)