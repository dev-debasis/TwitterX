import { Router } from "express";
import {
  createTweet,
  getAllTweets,
  getUserTweets,
  deleteTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleFollow } from "../controllers/follow.controller.js";
import { toggleLike } from "../controllers/like.controller.js";
import { addReply, getReplies } from "../controllers/reply.controller.js";

const router = Router();

router.post("/", verifyJWT, createTweet);
router.get("/", getAllTweets);
router.get("/user/:userId", getUserTweets);
router.delete("/:id", verifyJWT, deleteTweet);
router.patch("/:id/follow", verifyJWT, toggleFollow);
router.patch("/:id/like", verifyJWT, toggleLike);
router.post("/:id/reply", verifyJWT, addReply);
router.get("/:id/replies", getReplies);

export default router;
