import mongoose, { Schema } from "mongoose";

const feedBack = new Schema({

    name: {
        type: String,
        require: true
    },

    email: {
        type: String,
        require: true

    },
    feedBack: {
        type: String,
        maxlength: 328989
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model("feedBack", feedBack)