import { Router } from "express"
import { verifyJWT,authorizeRoles } from "../middlewares/auth.middlewares.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { addGalleryImages, addProducts, deleteGalleryImage, deleteUser, getAllUser, getUser, makeUserAdmin, viewGalleryImage, viewGalleryImages, viewAllProducts, viewProduct, updateProductDetails, updateProductImage, deleteProduct, getProductReviews, makeAdminUser } from "../controllers/admin.controllers.js";

const adminRouter = Router();

// users
adminRouter.route("/view/users").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getAllUser);

adminRouter.route("/view/users/:id").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getUser);

adminRouter.route("/view/users/:id/makeadmin").put(verifyJWT,authorizeRoles(["superadmin"]),makeUserAdmin)

adminRouter.route("/view/users/:id/makeuser").put(verifyJWT,authorizeRoles(["superadmin"]),makeAdminUser)

adminRouter.route("/view/users/:id/delete").delete(verifyJWT,authorizeRoles(["admin","superadmin"]),deleteUser)



// // gallery
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
adminRouter.route("/view/products/addProducts").post(
    verifyJWT,
    authorizeRoles(["admin","superadmin"]),
    upload.fields([
        {
            name:"image",
            maxCount: 1
        }
    ]),
    addProducts
)

adminRouter.route("/view/products").get(verifyJWT,authorizeRoles(["admin","superadmin"]),viewAllProducts)

adminRouter.route("/view/products/:id").get(verifyJWT,authorizeRoles(["admin","superadmin"]),viewProduct)

adminRouter.route("/view/products/:id/update/details").put(verifyJWT,authorizeRoles(["admin","superadmin"]),updateProductDetails)

adminRouter.route("/view/products/:id/update/image").put(
    verifyJWT,
    authorizeRoles(["admin","superadmin"]),
    upload.fields([
        {
            name:"image",
            maxCount: 1
        }
    ]),
    updateProductImage
)

adminRouter.route("/view/products/:id/deleteProduct").delete(verifyJWT,authorizeRoles(["admin","superadmin"]),deleteProduct)

adminRouter.route("/view/products/:id/reviews").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getProductReviews)


// order



export default adminRouter
