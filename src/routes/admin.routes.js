import { Router } from "express"
import { verifyJWT,authorizeRoles } from "../middlewares/auth.middlewares.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { addGalleryImages, deleteGalleryImages, getAllUser, getUser, viewGalleryImage, viewGalleryImages } from "../controllers/admin.controllers.js";

const adminRouter = Router();


adminRouter.route("/view/users").get(verifyJWT,authorizeRoles("admin"),getAllUser);

adminRouter.route("/view/users/:id").get(verifyJWT,authorizeRoles("admin"),getUser);

adminRouter.route("/gallery/addImage").post(
        verifyJWT,
        authorizeRoles("admin"),
        upload.fields([
            {
                name:"image",
                maxCount: 1
            }
        ]),
        addGalleryImages
);

adminRouter.route("/gallery/deleteImage/:id").delete(verifyJWT,authorizeRoles("admin"),deleteGalleryImages)

adminRouter.route("/gallery").get(verifyJWT,authorizeRoles("admin"),viewGalleryImage)

adminRouter.route("/gallery/:id").get(verifyJWT,authorizeRoles("admin"),viewGalleryImages)


export default adminRouter
