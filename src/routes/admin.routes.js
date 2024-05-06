import { Router } from "express"
import { verifyJWT,authorizeRoles } from "../middlewares/auth.middlewares.js"
import { upload } from "../middlewares/multer.middlewares.js"
import { addGalleryImages, addProducts, deleteGalleryImage, deleteUser, getAllUser, getUser, makeUserAdmin, viewGalleryImage, viewGalleryImages, viewAllProducts, viewProduct, updateProductDetails, updateProductImage, deleteProduct, getProductReviews, makeAdminUser, getAllOrders, getOrder, completeOrder, getPlacedOrders, getDeliveredOrders, addExercises, veiwAllExercises, viewExercise, deleteExercise, viewGreviences, viewUserGrevience, responseForEmployement, getAllAvailableDeliveryPartners, assignOrder, getShippingOrders, getApprovedOrders, getChurnedUsers, userLikelyToBeChurned, getNeggaUsers, userNegativeReviews, sendNotificationsToUser, findSimilarUsers, getAbandonUsers, findAbandonUsers, groupNotifications, recommendProductsBySimilarity, customRecommendations, getAdminDashboard } from "../controllers/admin.controllers.js";

const adminRouter = Router();

// users
adminRouter.route("/view/users").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getAllUser);

adminRouter.route("/view/users/:id").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getUser);

adminRouter.route("/view/users/:id/makeadmin").put(verifyJWT,authorizeRoles(["superadmin"]),makeUserAdmin)

adminRouter.route("/view/users/:id/makeuser").put(verifyJWT,authorizeRoles(["superadmin"]),makeAdminUser)

adminRouter.route("/view/users/:id/delete").delete(verifyJWT,authorizeRoles(["admin","superadmin"]),deleteUser)



// // gallery
// adminRouter.route("/view/gallery/addImage").post(
//     verifyJWT,
//     authorizeRoles(["admin","superadmin"]),
//     upload.fields([
//         {
//             name:"image",
//             maxCount: 1
//         }
//     ]),
//     addGalleryImages
// );


// test route 
adminRouter.route("/view/gallery/addImage").post(
    upload.fields([
        {
            name:"image",
            maxCount: 1
        }
    ]),
    addGalleryImages
);

adminRouter.route("/view/gallery").get(verifyJWT,authorizeRoles(["admin","superadmin"]),viewGalleryImages)

adminRouter.route("/view/gallery/:id").get(verifyJWT,authorizeRoles(["admin","superadmin"]),viewGalleryImage)

adminRouter.route("/view/gallery/:id/deleteImage").delete(verifyJWT,authorizeRoles(["admin","superadmin"]),deleteGalleryImage)


// exercises
adminRouter.route("/view/exercises/addExercise").post(
    upload.fields([
        {
            name:"exerciseGif",
            maxCount: 1
        }
    ]),
    addExercises
)

adminRouter.route("/view/exercises").get(verifyJWT,authorizeRoles(["admin","superadmin"]),veiwAllExercises)

adminRouter.route("/view/exercises/:id").get(verifyJWT,authorizeRoles(["admin","superadmin"]),viewExercise)

adminRouter.route("/view/exercises/:id/delete").delete(verifyJWT,authorizeRoles(["admin","superadmin"]),deleteExercise)



// products
// adminRouter.route("/view/products/addProducts").post(
//     verifyJWT,
//     authorizeRoles(["admin","superadmin"]),
//     upload.fields([
//         {
//             name:"image",
//             maxCount: 1
//         }
//     ]),
//     addProducts
// )

adminRouter.route("/view/products/addProducts").post(
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


// orders
adminRouter.route("/view/orders").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getAllOrders)

adminRouter.route("/view/orders/placed").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getPlacedOrders)

adminRouter.route("/view/orders/shipping").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getShippingOrders)

adminRouter.route("/view/orders/approved").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getApprovedOrders)

adminRouter.route("/view/orders/delivered").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getDeliveredOrders)

adminRouter.route("/view/orders/:id").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getOrder)

adminRouter.route("/view/orders/:id/complete").put(verifyJWT,authorizeRoles(["admin","superadmin"]),completeOrder)


// employee
adminRouter.route("/view/greviences").get(verifyJWT,authorizeRoles(["admin","superadmin"]),viewGreviences)

adminRouter.route("/view/greviences/:id").get(verifyJWT,authorizeRoles(["admin","superadmin"]),viewUserGrevience)

adminRouter.route("/view/greviences/:id/response").put(verifyJWT,authorizeRoles(["admin","superadmin"]),responseForEmployement)

adminRouter.route("/view/orders/:id/getDelBoys").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getAllAvailableDeliveryPartners)

adminRouter.route("/view/orders/:orderId/assign/:empId").put(verifyJWT,authorizeRoles(["admin","superadmin"]),assignOrder)


// admin side anaylysus
adminRouter.route("/view/churned").put(verifyJWT,authorizeRoles(["admin","superadmin"]),getChurnedUsers)

adminRouter.route("/view/churned/getUsers").get(verifyJWT,authorizeRoles(["admin","superadmin"]),userLikelyToBeChurned)

adminRouter.route("/view/sentiments").put(verifyJWT,authorizeRoles(["admin","superadmin"]),getNeggaUsers)

adminRouter.route("/view/sentiments/getUsers").get(verifyJWT,authorizeRoles(["admin","superadmin"]),userNegativeReviews)


// Notifications
adminRouter.route("/view/users/:id/sendNot").put(verifyJWT,authorizeRoles(["admin","superadmin"]),sendNotificationsToUser)


// Similar USers
adminRouter.route("/view/users/:id/findSim").get(verifyJWT,authorizeRoles(["admin","superadmin"]),findSimilarUsers)

adminRouter.route("/view/cartAbandon").put(verifyJWT,authorizeRoles(["admin","superadmin"]),getAbandonUsers)

adminRouter.route("/view/cartAbandon/getUsers").get(verifyJWT,authorizeRoles(["admin","superadmin"]),findAbandonUsers)

adminRouter.route("/view/users/groupNot").put(verifyJWT,authorizeRoles(["admin","superadmin"]),groupNotifications)

adminRouter.route("/view/users/:userId/similRecom/:productId").put(verifyJWT,authorizeRoles(["admin","superadmin"]),recommendProductsBySimilarity)

adminRouter.route("/view/users/:id/custRec").put(verifyJWT,authorizeRoles(["admin","superadmin"]),customRecommendations)

adminRouter.route("/view/dashboard").get(verifyJWT,authorizeRoles(["admin","superadmin"]),getAdminDashboard)

export default adminRouter
