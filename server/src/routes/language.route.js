import { Router } from "express";
import { requestLanguageChange, verifyLanguageChange } from "../controllers/languageController.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";  

const router = Router();
router.route("/request-change").post(verifyJWT, requestLanguageChange);
router.route("/verify-change").post(verifyJWT, verifyLanguageChange);

export default router;