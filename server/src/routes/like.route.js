import { Router } from "express";
import { toggleLike } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.patch("/:id/like", verifyJWT, toggleLike);

export default router;
