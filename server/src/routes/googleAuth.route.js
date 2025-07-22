import { Router } from "express";
import { googleAuth } from "../controllers/googleAuth.controller.js";

const router = Router();

router.route("/google").post(googleAuth);

export default router;