import { Router } from "express"
import { loginUser, registerUser, profile, updateAvatar, updateCoverImage, changePassword, updateProfile } from "../controllers/user.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { toggleFollow } from "../controllers/follow.controller.js"
import { upload } from "../middlewares/multer.middleware.js"


const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router
    .route("/profile")
    .get(verifyJWT, profile)
    .patch(verifyJWT, updateProfile)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)
router.route("/update-cover").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)
router.route("/change-password").patch(verifyJWT, changePassword)
router.route("/follow/:id").patch(verifyJWT, toggleFollow)

export default router