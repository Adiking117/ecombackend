import { Router } from "express"

import { registerUser,loginUser, updateUserProfile, logoutUser, getDetails, getAllProducts, getProduct, getProductsByCategory, addItemsToCart, viewCartItems, addCartItemQty, subCartItemQty, deleteCartItem, deleteCart, rateAndReviewProduct, editProductReview, deleteProductReveiw, addToWishlist, viewWishlist, deleteWishlistProduct, deleteWishlist, buyCartProducts, getMyOrders, getOrderHistory, updateShippingDetails, getProfile, getShippingDetails, buyAgainOrders, getAllNotications, getNotificationById, getProductsBySearch, getCityCountryProfileList, deleteNotificationById, deleteAllNotifications, checkoutInitialization } from "../controllers/user.controllers.js"
import { verifyJWT,authorizeRoles } from "../middlewares/auth.middlewares.js"
import { start,end } from "../middlewares/session.middlewares.js"
import { getOrder, getProductReviews, viewGalleryImage, viewGalleryImages } from "../controllers/admin.controllers.js"
import { getRecommendedExercisesByExerciseUserGoals, getRecommendedProductsByAdmin, getRecommendedProductsByAgeHeightWeight, getRecommendedProductsByFrequentlyBuying, getRecommendedProductsByFrequentlyBuyingStorePage, getRecommendedProductsByGoalGender, getRecommendedProductsByProductUserGoals, getRecommendedProductsByRecentlyPurchasedProducts, getRecommendedProductsByRecentlySearchedProducts, getRecommendedProductsByRecentlyViewedProducts, getRecommendedProductsByTimeLine, getRecommendedProductsByTop5PurchasedProducts } from "../recommendations/recommendation.controllers.js"
import { getAssignedOrders, getDeliveredOrdersHistory, otpVerification, requestAdminForEmployement, sendOtpToUser } from "../controllers/employee.controllers.js"

const userRouter = Router()

userRouter.use((req, res, next) => {
    start(req, res, () => {
        end(req, res, next);
    });
});

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

userRouter.route("/get-profile/cityList").get(verifyJWT,getCityCountryProfileList)

// Gallery
userRouter.route("/gallery").get(viewGalleryImages)

userRouter.route("/gallery/:id").get(viewGalleryImage)


// Products
userRouter.route("/view/products/search").get(verifyJWT,getProductsBySearch)

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


// Wishlist
userRouter.route("/view/products/:id/addToWishlist").post(verifyJWT,addToWishlist)

userRouter.route("/view/wishlist").get(verifyJWT,viewWishlist)

userRouter.route("/view/wishlist/:id/removeItem").put(verifyJWT,deleteWishlistProduct)

userRouter.route("/view/wishlist/deleteWishlist").put(verifyJWT,deleteWishlist)

userRouter.route("/view/wishlist/:id/moveToCart").put(verifyJWT,addItemsToCart)


// order
userRouter.route("/buy").put(verifyJWT,checkoutInitialization)

userRouter.route("/buy/products").post(verifyJWT,authorizeRoles(["user"]),buyCartProducts)

userRouter.route("/view/orders").get(verifyJWT,getMyOrders)

userRouter.route("/view/orders/history").get(verifyJWT,getOrderHistory)

userRouter.route("/view/orders/:id").get(verifyJWT,getOrder)

userRouter.route("/view/orders/:id/buyagain").post(verifyJWT,buyAgainOrders)


// notification
userRouter.route("/view/notifications").get(verifyJWT,getAllNotications)

userRouter.route("/view/notifications/:id").put(verifyJWT,getNotificationById)

userRouter.route("/view/notifications/:id/delete").delete(verifyJWT,deleteNotificationById)

userRouter.route("/view/notifications/deleteAll").delete(verifyJWT,deleteAllNotifications)


// Recommendation
userRouter.route("/view/products/recommendation/ageHeightWeight").get(verifyJWT,getRecommendedProductsByAgeHeightWeight)

userRouter.route("/view/products/recommendation/goalGender").get(verifyJWT,getRecommendedProductsByGoalGender)

userRouter.route("/view/products/products/:id/recommendation/freqBuy").get(verifyJWT,getRecommendedProductsByFrequentlyBuying)

userRouter.route("/view/products/products/recommendation/sequence").get(verifyJWT,getRecommendedProductsByFrequentlyBuyingStorePage)

userRouter.route("/view/exercise/recommendation").get(verifyJWT,getRecommendedExercisesByExerciseUserGoals)

userRouter.route("/view/products/recommendation/goals").get(verifyJWT,getRecommendedProductsByProductUserGoals)

userRouter.route("/view/products/recommendation/prevPurchase").get(verifyJWT,getRecommendedProductsByRecentlyPurchasedProducts)

userRouter.route("/view/products/recommendation/prevView").get(verifyJWT,getRecommendedProductsByRecentlyViewedProducts)

userRouter.route("/view/products/recommendation/prevSearch").get(verifyJWT,getRecommendedProductsByRecentlySearchedProducts)

userRouter.route("/view/products/recommendation/top5Purchase").get(verifyJWT,getRecommendedProductsByTop5PurchasedProducts)

userRouter.route("/view/products/recommendation/getByTime").get(verifyJWT,getRecommendedProductsByTimeLine)

userRouter.route("/view/products/recommendation/getFromAdmin").get(verifyJWT,getRecommendedProductsByAdmin)

// employee
userRouter.route("/greviences/send").post(verifyJWT,requestAdminForEmployement)

userRouter.route("/view/employee/orders").get(verifyJWT,authorizeRoles(["employee"]),getAssignedOrders)

userRouter.route("/view/employee/orders/history").get(verifyJWT,authorizeRoles(["employee"]),getDeliveredOrdersHistory)

userRouter.route("/view/orders/:id/sendOTP").post(verifyJWT,authorizeRoles(["employee"]),sendOtpToUser)

userRouter.route("/view/orders/:id/verifyOTP").put(verifyJWT,authorizeRoles(["employee"]),otpVerification)


export default userRouter