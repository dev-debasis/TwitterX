import mongoose, { Schema } from "mongoose"

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
    followersCount: {
        type: Number,
        default: 0
    },
    followingsCount: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
})

userSchema.index({ email: 1 })
userSchema.index({ username: 1 })

userSchema.pre("save", async() => {
    if(!this.isModified("password")) next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async(password) => {
    return await bcrypt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema)
