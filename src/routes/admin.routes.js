import { Router } from "express"
import { verifyJWT,authorizeRoles } from "../middlewares/auth.middlewares.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { addGalleryImages, deleteGalleryImage, deleteUser, getAllUser, getUser, makeUserAdmin, viewGalleryImage, viewGalleryImages } from "../controllers/admin.controllers.js";

const adminRouter = Router();

// users
adminRouter.route("/view/users").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getAllUser);

adminRouter.route("/view/users/:id").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getUser);

adminRouter.route("/view/users/:id/makeadmin").put(verifyJWT,authorizeRoles(["superadmin"]),makeUserAdmin)

adminRouter.route("/view/users/:id/delete").delete(verifyJWT,authorizeRoles(["admin","superadmin"]),deleteUser)



// gallery
adminRouter.route("/view/gallery/addImage").post(
        verifyJWT,
        authorizeRoles(["admin","superadmin"]),
        upload.fields([
            {
                name:"image",
                maxCount: 1
            }
        ]),
        addGalleryImages
);


// test route 
// adminRouter.route("/view/gallery/addImage").post(
//     upload.fields([
//         {
//             name:"image",
//             maxCount: 1
//         }
//     ]),
//     addGalleryImages
// );

adminRouter.route("/view/gallery").get(verifyJWT,authorizeRoles(["admin","superadmin"]),viewGalleryImages)

adminRouter.route("/view/gallery/:id").get(verifyJWT,authorizeRoles(["admin","superadmin"]),viewGalleryImage)

adminRouter.route("/view/gallery/:id/deleteImage").delete(verifyJWT,authorizeRoles(["admin","superadmin"]),deleteGalleryImage)



// products


// order



export default adminRouter
