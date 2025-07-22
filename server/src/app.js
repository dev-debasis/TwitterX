import express, { urlencoded } from "express";
import cors from "cors"
import cookieParser from "cookie-parser"

import userRouter from "./routes/user.route.js"
import tweetRouter from "./routes/tweet.route.js"
import googleAuthRouter from "./routes/googleAuth.route.js"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(urlencoded({
    extended: true
}))
app.use(express.json())
app.use(cookieParser())
app.use("/uploads", express.static("uploads"))


app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/auth", googleAuthRouter)

export { app }
