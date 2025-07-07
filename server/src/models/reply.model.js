import mongoose, { mongo, Mongoose, Schema } from "mongoose"

const replySchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    tweetId: {
        type: mongoose.Types.ObjectId,
        ref: "Tweet"
    },
    content: {
        type: String,
        required: true
    }
},
{
    timestamps: true
})

replySchema.index({ tweetId: 1 })

export const Reply = mongoose.model("Reply", replySchema)