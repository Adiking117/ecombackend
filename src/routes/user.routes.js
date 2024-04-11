import { Router } from "express"

import { registerUser,loginUser, updateUserProfile, logoutUser, getDetails, getAllProducts, getProduct, getProductsByCategory, addItemsToCart, viewCartItems, addCartItemQty, subCartItemQty, deleteCartItem, deleteCart, rateAndReviewProduct, editProductReview, deleteProductReveiw, addToWishlist, viewWishlist, deleteWishlistProduct, deleteWishlist, buyCartProducts, getMyOrders, getOrderHistory, updateShippingDetails, getProfile, getShippingDetails } from "../controllers/user.controllers.js"
import { verifyJWT,authorizeRoles } from "../middlewares/auth.middlewares.js"
import { getOrder, getProductReviews, viewGalleryImage, viewGalleryImages } from "../controllers/admin.controllers.js"

const userRouter = Router()

// Authorization
userRouter.route("/register").post(registerUser)

userRouter.route("/login").post(loginUser)

userRouter.route("/logout").post(verifyJWT,logoutUser)


// Userdetails
userRouter.route("/profile").put(verifyJWT,updateUserProfile)

userRouter.route("/get-details").get(verifyJWT,getDetails)

userRouter.route("/shippingDetails").put(verifyJWT,updateShippingDetails)

userRouter.route("/get-profile").get(verifyJWT,getProfile)

userRouter.route("/get-shipping").get(verifyJWT,getShippingDetails)


// Gallery
userRouter.route("/gallery").get(viewGalleryImages)

userRouter.route("/gallery/:id").get(viewGalleryImage)


// Products
userRouter.route("/view/products").get(getAllProducts)

userRouter.route("/view/products/:id").get(getProduct)

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


// Wishlist
userRouter.route("/view/products/:id/addToWishlist").post(verifyJWT,addToWishlist)

userRouter.route("/view/wishlist").get(verifyJWT,viewWishlist)

userRouter.route("/view/wishlist/:id/removeItem").put(verifyJWT,deleteWishlistProduct)

userRouter.route("/view/wishlist/deleteWishlist").put(verifyJWT,deleteWishlist)

userRouter.route("/view/wishlist/:id/moveToCart").put(verifyJWT,addItemsToCart)


// order
userRouter.route("/buy/products").post(verifyJWT,buyCartProducts)

// userRouter.route("/view/orders/:id/pay").put(verifyJWT,doPayment)

userRouter.route("/view/orders").get(verifyJWT,getMyOrders)

userRouter.route("/view/orders/:id").get(verifyJWT,getOrder)

userRouter.route("/view/orders/history").get(verifyJWT,getOrderHistory)

export default userRouter
