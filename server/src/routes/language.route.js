import { Router } from "express";
import { 
    requestLanguageChange,
    verifyLanguageChange,
    dynamicTranslate
} from "../controllers/language.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";  

const router = Router();
router.route("/request-change").post(verifyJWT, requestLanguageChange);
router.route("/verify-change").post(verifyJWT, verifyLanguageChange);
router.route("/translate").get(dynamicTranslate);

export default router;