import { User } from "../models/user.models.js"
import { Profile } from "../models/profile.models.js"
import { Product } from "../models/products.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Order } from "../models/orders.models.js"
import { Shipping } from "../models/shipping.models.js"
import { Notification } from "../models/notifications.models.js"


const generateUserAccessRefreshToken = async function(user_id){
    try {
        const user = await User.findById(user_id);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({validation:false})
        return { accessToken,refreshToken }
    } catch (error) {
        throw new ApiError(500,error)
    }
}


const registerUser = asyncHandler(async(req,res)=>{
    const {userName , email , firstName , lastName , password } = req.body;
    console.log("register triggered",req.body)

    if (!userName || !email || !firstName || !lastName || !password) {
        throw new ApiError(401, "Fill all the details");
    }
    
    const existedUser = await User.findOne({userName})
    if(existedUser){
        throw new ApiError(401,"User Already exists")
    }

    const user = await User.create({
        userName,
        email,
        firstName,
        lastName,
        password,
        role:'user'
    })

    if(email === 'www.adivc2003@gmail.com'){
        user.role = 'superadmin'
    }

    await user.save();

    console.log("user  ",user)

    const newuser = await User.findById(user._id).select("-password")
    // console.log(newuser)

    if(!newuser){
        throw new ApiError(500,"Something went Wrong")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,newuser,"User Registered Successfully")
    )
})


const loginUser = asyncHandler(async(req,res)=>{
    const { userName , password } = req.body

    console.log("Login triggered" , req.body)

    const user = await User.findOne({userName})
    if(!user){
        throw new ApiError(401 , "User doesnt exists , Register first")
    }

    const isPasswordCorrect = await user.isPasswordValid(password)
    if(!isPasswordCorrect){
        throw new ApiError(401 , "Password Doesnt match")
    }

    const { accessToken,refreshToken } = await generateUserAccessRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {       
        httpOnly:true,
        // secure:true,
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                loggedInUser:loggedInUser,accessToken,refreshToken
            }
            ,"User Logged In Successfully"
        )
    )
})


const updateUserProfile = asyncHandler(async(req,res)=>{
    try {
        console.log("req user updateuserprofile",req.user)
        console.log("req body updateuserprofile",req.body)

        const userName = req.user.userName;
        const { age, weight, height, goal, gender, country, city } = req.body;
    
        if (!age || !weight || !height || !goal || !gender || !country || !city) {
          throw new ApiError(400, "All fields are required");
        }
        
        let profile = await Profile.findOne({ user: userName });
        
        if (!profile) {
          profile = new Profile({user: userName,age,weight,height,goal,gender,country,city,});
        } else {
          profile.age = age;
          profile.weight = weight;
          profile.height = height;
          profile.goal = goal;
          profile.gender = gender;
          profile.country = country;
          profile.city = city;
        }
    
        await profile.save();
        const options = {       
            httpOnly:true,
            secure:true
        }
    
        return res.status(200)
        // .cookie("accessToken",accessToken,options)
        // .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200, profile, "Profile updated successfully"));

      } catch (error) {
        console.error("Error updating profile:", error);
        throw new ApiError(500,"Profile not updated")
      }
})


const getDetails = asyncHandler(async(req,res)=>{
    
    //console.log("get details triggred")
    const {userName} = req.user;
    const user = await User.findOne({ userName })
    if(!user){
        throw new ApiError(400,"USer not found")
    }
    if(!user?.refreshToken){
        throw new ApiError(400,"You are not logged in")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,user," ")
    )
})


const logoutUser = asyncHandler(async(req,res)=>{
    console.log("logout controller", req.user)
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,`User logged out`)
    )
})


// Products
const getAllProducts = asyncHandler(async(req,res)=>{
    const products = await Product.find()
    if(products.length===0){
        throw new ApiError(401,"No products to show")
    }
    const user = req.user;
    const productsWithWishlistStatus = products.map(product => {
        const isInWishlist = user.wishlist.some((item) =>{
            return item._id.toString() === product._id.toString()
        });
        return {
            ...product.toObject(),
            inWishlist: isInWishlist
        };
    });
    return res
    .status(200)
    .json(
        new ApiResponse(200,productsWithWishlistStatus,"All Products fetched successfully")
    )
})

const getProduct = asyncHandler(async(req,res)=>{
    const product = await Product.findById(req.params.id)
    const user = req.user
    if(!product){
        throw new ApiError(404,product,"Product not found")
    }
    const isInWishlist = user.wishlist.some((item) =>{
        return item._id.toString() === product._id.toString()
    });
    const productDetails = {
        product,
        inWishlist: isInWishlist
    };
    return res
    .status(200)
    .json(
        new ApiResponse(200,productDetails,"Product fetched Successfully")
    )
})

const getProductsByCategory = asyncHandler(async(req,res)=>{
    console.log(req.query)
    const products = await Product.find({ category:req.query.category })
    if(products.length===0){
        throw new ApiError(401,"Products not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,products,"Products filtered successfully")
    )
})


// Reviews
const rateAndReviewProduct = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const user = req.user;

    const productToBeReviewed = await Product.findById(productId);
    if (!productToBeReviewed) {
        throw new ApiError(404, "Product Not found");
    }

    const newReview = {
        user: user._id,
        rating,
        comment
    };

    productToBeReviewed.reviews.push(newReview);

    const totalRatings = productToBeReviewed.reviews.length;
    const totalRatingsSum = productToBeReviewed.reviews.reduce((sum, review) => {
        return sum + review.rating;
    }, 0);
    productToBeReviewed.avgRating = totalRatings !== 0 ? (totalRatingsSum / totalRatings).toFixed(2) : 0;

    await productToBeReviewed.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200, productToBeReviewed.reviews , "Review added successfully")
    );
});

const editProductReview = asyncHandler(async(req,res)=>{
    const { rating, comment } = req.body;
    const { productId, reviewId } = req.params;
    const user = req.user;

    const productReviewToBeEdited = await Product.findById(productId);
    if (!productReviewToBeEdited) {
        throw new ApiError(404, "Product Not found");
    }
    console.log("productReviewToBeEdited",productReviewToBeEdited.reviews)

    const reviewIndex = productReviewToBeEdited.reviews.findIndex((review) => {
        return review._id.toString() === reviewId && review.user.toString() === user._id.toString();
    });
    if (reviewIndex === -1) {
        throw new ApiError(404, "Review Not found");
    }

    if (rating !== undefined) {
        productReviewToBeEdited.reviews[reviewIndex].rating = rating;
    }
    if (comment !== undefined) {
        productReviewToBeEdited.reviews[reviewIndex].comment = comment;
    }

    const totalRatings = productReviewToBeEdited.reviews.length;
    const totalRatingsSum = productReviewToBeEdited.reviews.reduce((sum, review) => {
        return sum + review.rating;
    }, 0);
    productReviewToBeEdited.avgRating = totalRatings !== 0 ? totalRatingsSum / totalRatings : 0;

    await productReviewToBeEdited.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200, productReviewToBeEdited.reviews , "Review edited successfully")
    );
});

const deleteProductReveiw = asyncHandler(async(req,res)=>{
    const {productId,reviewId} = req.params;
    const user = req.user

    const productReviewToBeDeleted = await Product.findById(productId);
    if (!productReviewToBeDeleted) {
        throw new ApiError(404, "Product Not found");
    }

    const reviewIndex = productReviewToBeDeleted.reviews.findIndex((review) => {
        return review._id.toString() === reviewId && review.user.toString() === user._id.toString()
    });
    if (reviewIndex === -1) {
        throw new ApiError(404, "Review Not found");
    }

    productReviewToBeDeleted.reviews.splice(reviewIndex, 1);

    const totalRatings = productReviewToBeDeleted.reviews.length;
    const totalRatingsSum = productReviewToBeDeleted.reviews.reduce((sum, review) => {
        return sum + review.rating;
    }, 0);
    productToBeReviewed.avgRating = totalRatings !== 0 ? (totalRatingsSum / totalRatings).toFixed(2) : 0;

    await productReviewToBeDeleted.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200, {} , "Review deleted successfully")
    );
})



// Cart
const addItemsToCart = asyncHandler(async(req,res)=>{
    const productid = req.params.id;
    const userId = req.user._id;
    // console.log(req.params,"   ",req.user)

    const product = await Product.findById(productid);
    if(!product){
        throw new ApiError(404,"Product not found")
    }

    const user = await User.findById(userId)

    if(!(product.stock > 0)){
        throw new ApiError(401,"Product out of stock")
    }

    const isProductInWishlist = user.wishlist.some((item) => {
        return item._id.toString() === productid
    });
    if(isProductInWishlist){
        user.wishlist = user.wishlist.filter((item) => item._id.toString() !== productid);
    }

    await user.addToCart(productid);

    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,user.cart.length,"Product added to cart successfully")
    )
})

const viewCartItems = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user.id)
    if(!user){
        throw new ApiError(404,"No user found")
    }
    const cartItems = user.cart
    // console.log(cartItems)
    return res
    .status(200)
    .json(
        new ApiResponse(200,cartItems,"Cart Products fetched successfully")
    )
})

const addCartItemQty = asyncHandler(async(req,res)=>{
    const productid = req.params.id
    if(!productid){
        throw new ApiError(404,"Product Not Found")
    }
    const user = req.user
    await user.addQty(productid);
    return res
    .status(200)
    .json(
        new ApiResponse(200,user.cart,"Quantity added successfully")
    )
})

const subCartItemQty = asyncHandler(async(req,res)=>{
    const productid = req.params.id
    if(!productid){
        throw new ApiError(404,"Product Not found")
    }
    const user = req.user
    await user.subQty(productid)
    return res
    .status(200)
    .json(
        new ApiResponse(200,user.cart,"Quantity removed Successfully")
    )
})

const deleteCartItem = asyncHandler(async(req,res)=>{
    const productid = req.params.id
    if(!productid){
        throw new ApiError(404,"Product Not found")
    }
    const user = req.user
    await user.deleteFromCart(productid)
    return res
    .status(200)
    .json(
        new ApiResponse(200,user.cart,"Item removed from Cart Successfully")
    )
})

const deleteCart = asyncHandler(async(req,res)=>{
    const user = req.user
    user.cart = []
    await user.save();
    return res
    .status(200)
    .json(
        new ApiResponse(200,user.cart,"Cart Emptied Successfully")
    )
})


// Wishlist
const addToWishlist = asyncHandler(async(req,res)=>{
    const productId = req.params.id
    const userId = req.user._id

    const productToBeWishlisted = await Product.findById(productId)
    if(!productToBeWishlisted){
        throw new ApiError(404,"Product not found")
    }

    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(404,"User not found")
    }

    const isProductInWishlist = user.wishlist.some((item) => {
        return item._id.toString() === productId
    });
    if(!isProductInWishlist){
        user.wishlist.push(productToBeWishlisted.toObject());
        await user.save();
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,user.wishlist,"Product added to wishlist")
    )
})

const viewWishlist = asyncHandler(async(req,res)=>{
    const userId = req.user.id
    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(404,"User doesnt exist")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,user.wishlist,"User Wishlist fetched successfully")
    )
})

const deleteWishlistProduct = asyncHandler(async(req,res)=>{
    const productId = req.params.id
    const userId = req.user._id

    const productToBeRemoveFromWishlist = await Product.findById(productId)
    if(!productToBeRemoveFromWishlist){
        throw new ApiError(404,"Product not found")
    }

    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(404,"User not found")
    }

    await user.deleteFromWishlist(productId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,user.wishlist,"Product removed from wishlist")
    )
})

const deleteWishlist = asyncHandler(async(req,res)=>{
    const user = req.user
    user.wishlist = []
    await user.save();
    return res
    .status(200)
    .json(
        new ApiResponse(200,user.wishlist,"Wishlist is Emtpy")
    )
})


// -> buy cart products -> order creation
const buyCartProducts = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id);
    // console.log("user" ,user)
    let orderItems = [];
    let tax = 0.18;
    let totalPrice = 0;
    for(const item of user.cart){
        const productToBeOrdered = await Product.findById(item.product._id)
        if(!productToBeOrdered){
            throw new ApiError(401,"Product not found")
        }
        const {name,image,price} = productToBeOrdered;
        const singleOrderItem = {
            name:name,
            image:image,
            price:price,
            product:productToBeOrdered._id
        }
        //orderItems = [...orderItems,singleOrderItem];
        orderItems.push(singleOrderItem)
        productToBeOrdered.stock -= item.quantity;
        totalPrice += (price*item.quantity);
        productToBeOrdered.save();
    }
    let subtotalPrice = totalPrice + (totalPrice*tax);
    const {paymentMethod} = req.body;

    //const shippingInfo = await Shipping.findById(user.shippingInfo._id)

    const order = await Order.create({
        user:req.user._id,
        orderItems:orderItems,
        totalProductPrice:totalPrice,
        subtotalPrice:subtotalPrice,
        paymentMethod:paymentMethod,
        //shippingInfo:shippingInfo,
    })

    if(!order){
        throw new ApiError(500,"Order not successfull")
    }

    user.orders.push(order)
    user.cart = [];
    // const notification = new Notification({ user: user._id, message: "Order Placed Successfully" });
    const notification = await Notification.create({
        user:user._id,
        message: "Order Placed Successfully"
    })
    user.notifications.push(notification);
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,order,"Order created successfully")
    )

})


const doPayment = asyncHandler(async(req,res)=>{
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if(!order){
        throw new ApiError(404,"Order not found")
    }
    order.paymentStatus = 'Done'
    await order.save();
    return res
    .status(200)
    .json(
        new ApiResponse(200,order,"Payment Done successfully")
    )
})


const getMyOrders = asyncHandler(async(req,res)=>{
    const user = req.user;
    const orders = user.orders;
    return res
    .status(200)
    .json(
        new ApiResponse(200,orders,"Orders fetched Successfully")
    )
})


const getOrderHistory = asyncHandler(async(req,res)=>{
    const user = req.user;
    const orders = user.orderHistory;
    return res
    .status(200)
    .json(
        new ApiResponse(200,orders,"Orders fetched Successfully")
    )
})

export {
    registerUser,
    loginUser,
    updateUserProfile,
    getDetails,
    logoutUser,
    getAllProducts,
    getProduct,
    getProductsByCategory,
    addItemsToCart,
    viewCartItems,
    addCartItemQty,
    subCartItemQty,
    deleteCartItem,
    deleteCart,
    rateAndReviewProduct,
    editProductReview,
    deleteProductReveiw,
    addToWishlist,
    viewWishlist,
    deleteWishlistProduct,
    deleteWishlist,
    buyCartProducts,
    doPayment,
    getMyOrders,
    getOrderHistory
}