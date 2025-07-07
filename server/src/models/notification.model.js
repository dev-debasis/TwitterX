import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
    receiverId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    senderId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    type: {
        type: String,
        enum: ["follow", "like", "reply", "retweet"]
    },
    tweetId: {
        type: mongoose.Types.ObjectId,
        ref: "Tweet",
        required: false
    },
    isRead: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: true
})

notificationSchema.index({
    receiverId: 1,
    isRead: 1
})

export const Notification = mongoose.model("Notification", notificationSchema)