import { Router } from "express";
import { addReply, getReplies } from "../controllers/reply.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:id/reply", verifyJWT, addReply);
router.get("/:id/replies", getReplies);

export default router;
