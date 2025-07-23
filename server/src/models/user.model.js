import mongoose, { Schema } from "mongoose"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    }, 
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: ""
    },
    avatar: {
        type: String,
        default: ""
    },
    coverImage: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: "India"
    },
    profession: {
        type: String,
        default: ""
    },
    notificationsEnabled: {
        type: Boolean,
        default: true
    },
    followersCount: {
        type: Number,
        default: 0
    },
    followingsCount: {
        type: Number,
        default: 0
    },
    googleId: {
        type: String,
        unique: true,
    },
    language: {
        type: String,
        default: "en"
    },
    phoneNumber: {
        type: String,
        default: ""
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    otpCode: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    otpType: {
        type: String,
        enum: ["email", "sms", null],
        default: null
    },
    pendingLanguage: {
        type: String,
        default: null
    }
},
{
    timestamps: true
})


userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema)
