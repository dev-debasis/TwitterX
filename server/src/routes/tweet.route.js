import { Router } from "express";
import {
  createTweet,
  getAllTweets,
  getUserTweets,
  deleteTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { likeTweet } from "../controllers/like.controller.js";
import { addReply, getReplies } from "../controllers/reply.controller.js";

const router = Router();

router.route("/").post(verifyJWT, createTweet);
router.route("/").get(getAllTweets);
router.route("/user/:userId").get(getUserTweets);
router.route("/:id").delete(verifyJWT, deleteTweet);
router.route("/reply/:id").post(verifyJWT, addReply);
router.route("/replies/:id").get(getReplies);
router.patch("/like/:tweetId", verifyJWT, likeTweet);

export default router;
