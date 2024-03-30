import { Router } from "express"

import { registerUser,loginUser, updateUserProfile, logoutUser, getDetails } from "../controllers/user.controllers.js"
import { verifyJWT,authorizeRoles } from "../middlewares/auth.middlewares.js"
import { viewGalleryImage, viewGalleryImages } from "../controllers/admin.controllers.js"

const userRouter = Router()

userRouter.route("/register").post(registerUser)

userRouter.route("/login").post(loginUser)

userRouter.route("/profile").post(verifyJWT,updateUserProfile)

userRouter.route("/get-details").get(verifyJWT,getDetails)

userRouter.route("/logout").post(verifyJWT,logoutUser)

userRouter.route("/gallery").get(verifyJWT,viewGalleryImage)

userRouter.route("/gallery/:id").get(verifyJWT,viewGalleryImages)


export default userRouter
