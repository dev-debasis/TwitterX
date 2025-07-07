import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
    senderId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    receiverId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    content: {
        type: String,
        required: true
    }
},
{
    timestamps: true
})

messageSchema.index({ 
    senderId: 1,
    receiverId: 1,
    createdAt: 1
})

export const Message = mongoose.model("Message", messageSchema)