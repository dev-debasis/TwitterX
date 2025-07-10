import { Router } from "express";
import { toggleFollow } from "../controllers/follow.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.patch("/:id/follow", verifyJWT, toggleFollow);

export default router;
