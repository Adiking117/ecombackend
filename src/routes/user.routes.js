import { Router } from "express"

import { registerUser,loginUser, updateUserProfile, logoutUser, getDetails, getAllProducts, getProduct, getProductsByCategory, addItemsToCart, viewCartItems, addCartItemQty, subCartItemQty, deleteCartItem, deleteCart, rateAndReviewProduct, editProductReview, deleteProductReveiw } from "../controllers/user.controllers.js"
import { verifyJWT,authorizeRoles } from "../middlewares/auth.middlewares.js"
import { getProductReviews, viewGalleryImage, viewGalleryImages } from "../controllers/admin.controllers.js"

const userRouter = Router()

// Authorization
userRouter.route("/register").post(registerUser)

userRouter.route("/login").post(loginUser)

userRouter.route("/logout").post(verifyJWT,logoutUser)


// Userdetails
userRouter.route("/profile").post(verifyJWT,updateUserProfile)

userRouter.route("/get-details").get(verifyJWT,getDetails)


// Gallery
userRouter.route("/gallery").get(verifyJWT,viewGalleryImages)

userRouter.route("/gallery/:id").get(verifyJWT,viewGalleryImage)


// Products
userRouter.route("/view/products").get(verifyJWT,getAllProducts)

userRouter.route("/view/products/:id").get(verifyJWT,getProduct)

userRouter.route("/view/products").get(verifyJWT,getProductsByCategory)


// Review & Rate a Product
userRouter.route("/view/products/:id/reviews").get(verifyJWT,getProductReviews)

userRouter.route("/view/products/:id/reviews/add").post(verifyJWT,rateAndReviewProduct)

userRouter.route("/view/products/:productId/reviews/:reviewId/edit").put(verifyJWT,editProductReview)

userRouter.route("/view/products/:productId/reviews/:reviewId/delete").put(verifyJWT,deleteProductReveiw)


// Cart
userRouter.route("/view/products/:id/addToCart").post(verifyJWT,addItemsToCart)

userRouter.route("/view/cart").get(verifyJWT,viewCartItems)

userRouter.route("/view/cart/:id/addQty").put(verifyJWT,addCartItemQty)

userRouter.route("/view/cart/:id/subQty").put(verifyJWT,subCartItemQty)

userRouter.route("/view/cart/:id/deleteItem").put(verifyJWT,deleteCartItem)

userRouter.route("/view/cart/delCart").put(verifyJWT,deleteCart)



export default userRouter
