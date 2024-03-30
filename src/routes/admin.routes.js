import { Router } from "express"
import { verifyJWT,authorizeRoles } from "../middlewares/auth.middlewares.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { addGalleryImages, deleteGalleryImage, deleteUser, getAllUser, getUser, makeUserAdmin, viewGalleryImage, viewGalleryImages } from "../controllers/admin.controllers.js";

const adminRouter = Router();

// users
adminRouter.route("/view/users").get(verifyJWT,authorizeRoles("admin"),getAllUser);

adminRouter.route("/view/users/:id").get(verifyJWT,authorizeRoles("admin"),getUser);

adminRouter.route("/view/users/:id/makeadmin").patch(verifyJWT,authorizeRoles("admin"),makeUserAdmin)

adminRouter.route("/view/users/:id/delete").delete(verifyJWT,authorizeRoles("admin"),deleteUser)



// gallery
adminRouter.route("/view/gallery/addImage").post(
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

adminRouter.route("/view/gallery").get(verifyJWT,authorizeRoles("admin"),viewGalleryImages)

adminRouter.route("/view/gallery/:id").get(verifyJWT,authorizeRoles("admin"),viewGalleryImage)

adminRouter.route("/view/gallery/:id/deleteImage").delete(verifyJWT,authorizeRoles("admin"),deleteGalleryImage)



// products


// order



export default adminRouter
