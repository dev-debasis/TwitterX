import { Router } from "express"
import { loginUser, registerUser, profile, updateAvatar, updateCoverImage, changePassword, updateProfile} from "../controllers/user.controller"
import { verifyJWT } from "../middlewares/auth.middleware"
import { verify } from "crypto"

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router
    .route("/profile")
    .get(verifyJWT, profile)
    .patch(verifyJWT, updateProfile)
router.route("/update-avatar").patch(verifyJWT, updateAvatar)
router.route("/update-cover").patch(verifyJWT, updateCoverImage)
router.route("/change-password").patch(verifyJWT, changePassword)

export default router