import mongoose, { Schema } from "mongoose"

const tweetSchema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    content: {
        type: String,
    },
    image: {
        type: String,
        default: ""
    },
    likeCounts: {
        type: Number,
        default: 0
    },
    repliesCount: {
        type: Number,
        default: 0
    },
    reTweetCount: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
})

tweetSchema.index({ userId: 1 })
tweetSchema.index({ createdAt: -1 })

export const Tweet = mongoose.model("Tweet", tweetSchema)