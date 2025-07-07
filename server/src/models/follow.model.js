import mongoose, { mongo, Schema } from "mongoose"

const followSchema = new Schema({
    followerId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    followingId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    }
},
{
    timestamps: true
})

followSchema.index({ followerId: 1 })
followSchema.index({ followingId: 1 })

export const Follow = mongoose.model("Follow", followSchema)