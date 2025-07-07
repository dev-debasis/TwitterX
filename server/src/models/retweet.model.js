import mongoose, { Schema } from "mongoose";

const reTweetSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    tweetId: {
        type: mongoose.Types.ObjectId,
        ref: "Tweet"
    }
},
{
    timestamps: true
})

reTweetSchema.index({ 
    userId: 1,
    tweetId: 1
})

export const ReTweet = mongoose.model("ReTweet", reTweetSchema)