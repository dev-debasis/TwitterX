import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
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

likeSchema.index({
    userId: 1,
    tweetId: 1
})

export const Like = mongoose.model("Like", likeSchema)
