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
import { UserHistory } from "../models/userHistory.models.js"
import { Review } from "../models/review.models.js"
import * as fs from 'fs';
import { fileLocation,recommendations } from "../filelocation.js"
import { OrderTransaction } from "../models/orderTransaction.models.js"
import { CartAbandon } from "../models/cartAbondon.models.js"
import path from "path"
import { dirname } from 'path';
import { fileURLToPath } from 'url';

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

const startSession = async function(userId) {
    const session = await UserHistory.findOne({user:userId})
    session.startTime = new Date()
    await session.save();
    return session;
}

const endSession = async function(userId) {
    const session = await UserHistory.findOne({ user: userId });
    session.endTime = new Date();
    const sessionDuration = (session.endTime - session.startTime) / 60000;
    if (!isNaN(session.sessionDuration)) {
        session.sessionDuration += sessionDuration; 
    } else {
        session.sessionDuration = sessionDuration;
    }
    await session.save();
}


const registerUser = asyncHandler(async(req,res)=>{
    const {userName , email , firstName , lastName , password } = req.body;
    //console.log("register triggered",req.body)

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

    const userHistory = await UserHistory.create({
        user:user._id
    })
    await userHistory.save();
    //console.log("user  ",user)

    user.userHistory = userHistory._id;

    await user.save();

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

    await CartAbandon.findOneAndUpdate(
        {user:user._id},
        {
            $inc: { timesLogIn: 1 }
        },
        {
            upsert:true
        }
    )

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


const logoutUser = asyncHandler(async(req,res)=>{
    //console.log("logout controller", req.user)

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


const updateUserProfile = asyncHandler(async(req,res)=>{
    try {
        //console.log("req user updateuserprofile",req.user)
        //console.log("req body updateuserprofile",req.body)

        const { age, weight, height, goal, gender, country, city, systolicBp , diastolicBp , diabetes,cholesterol } = req.body;
    
        if (!age || !weight || !height || !goal || !gender || !country || !city  || !systolicBp || !diastolicBp || !diabetes || !cholesterol) {
          throw new ApiError(400, "All fields are required");
        }
        
        // let profile = await Profile.findById(req.user.userProfile.toString());
        let profile = await Profile.findOne({user:req.user._id})
        //console.log(profile)
        const bp = systolicBp / diastolicBp;
        const bpLevel = (bp < 0.9) ? "Low":(bp >= 0.9 && bp <= 1.2) ? "Normal" :"High"
        const diabetesLevel = (diabetes < 100) ? "Low" :(diabetes >= 100 && diabetes < 125) ? "Normal" :"High";
        const cholesterolLevel = (cholesterol < 200) ? "Low" :(cholesterol >= 200 && cholesterol < 240) ? "Normal" :"High";

        if (!profile) {
          profile = new Profile({user: req.user._id,age,weight,height,goal,gender,country,city,bp ,bpLevel, diabetes,diabetesLevel, cholesterol,cholesterolLevel});
        } else {
          profile.age = age;
          profile.weight = weight;
          profile.height = height;
          profile.goal = goal;
          profile.gender = gender;
          profile.country = country;
          profile.city = city;
          profile.bp = bp;
          profile.bpLevel = bpLevel;
          profile.diabetes = diabetes;
          profile.diabetesLevel = diabetesLevel;
          profile.cholesterol = cholesterol;
          profile.cholesterolLevel = cholesterolLevel;
        }
    
        await profile.save();

        const user = req.user
        user.userProfile = profile._id;

        await user.save();
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


const updateShippingDetails = asyncHandler(async(req, res) => {
    const { address, city, state, country, pincode, phoneNo } = req.body;

    if (!address || !city || !state || !country || !pincode || !phoneNo) {
        throw new ApiError(400, "All fields are required");
    }

    let shipping = await Shipping.findOne({ user: req.user._id });

    if (!shipping) {
        shipping = new Shipping({
            user: req.user._id,
            address,
            city,
            state,
            country,
            pincode,
            phoneNo
        });
    } else {
        shipping.address = address;
        shipping.city = city;
        shipping.state = state;
        shipping.country = country;
        shipping.pincode = pincode;
        shipping.phoneNo = phoneNo;
    }

    await shipping.save();

    req.user.shippingInfo = shipping._id;
    await req.user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200, shipping, "Shipping information updated successfully")
    );
});


const getShippingDetails = asyncHandler(async(req,res)=>{
    const shippingDetails = await Shipping.findOne( {user:req.user._id} )
    if(!shippingDetails){
        throw new ApiError(404,"Shipping details not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,shippingDetails,"Shipping Details fetcehd successfully")
    )
})


const getProfile = asyncHandler(async(req,res)=>{
    const profileDetails = await Profile.findOne( {user:req.user._id} )
    if(!profileDetails){
        throw new ApiError(404,"Profile details not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,profileDetails,"Profile Details fetcehd successfully")
    )
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


const getCityCountryProfileList = asyncHandler(async(req,res)=>{
    const citylist = {
        "0": {
          "city": "Mumbai",
          "state": "Maharashtra",
          "country": "India"
        },
        "1": {
          "city": "Delhi",
          "state": "Delhi",
          "country": "India"
        },
        "2": {
          "city": "Bangalore",
          "state": "Karnataka",
          "country": "India"
        },
        "3": {
          "city": "Kolkata",
          "state": "West Bengal",
          "country": "India"
        },
        "4": {
          "city": "Chennai",
          "state": "Tamil Nadu",
          "country": "India"
        },
        "5": {
          "city": "Hyderabad",
          "state": "Telangana",
          "country": "India"
        },
        "6": {
          "city": "Pune",
          "state": "Maharashtra",
          "country": "India"
        },
        "7": {
          "city": "Ahmedabad",
          "state": "Gujarat",
          "country": "India"
        },
        "8": {
          "city": "Surat",
          "state": "Gujarat",
          "country": "India"
        },
        "9": {
          "city": "Jaipur",
          "state": "Rajasthan",
          "country": "India"
        },
        "10": {
          "city": "Lucknow",
          "state": "Uttar Pradesh",
          "country": "India"
        },
        "11": {
          "city": "Kanpur",
          "state": "Uttar Pradesh",
          "country": "India"
        },
        "12": {
          "city": "Nagpur",
          "state": "Maharashtra",
          "country": "India"
        },
        "13": {
          "city": "Patna",
          "state": "Bihar",
          "country": "India"
        },
        "14": {
          "city": "Indore",
          "state": "Madhya Pradesh",
          "country": "India"
        },
        "15": {
          "city": "Thane",
          "state": "Maharashtra",
          "country": "India"
        },
        "16": {
          "city": "Bhopal",
          "state": "Madhya Pradesh",
          "country": "India"
        },
        "17": {
          "city": "Visakhapatnam",
          "state": "Andhra Pradesh",
          "country": "India"
        },
        "18": {
          "city": "Vadodara",
          "state": "Gujarat",
          "country": "India"
        },
        "19": {
          "city": "Firozabad",
          "state": "Uttar Pradesh",
          "country": "India"
        }
      }
      
    return res
    .status(200)
    .json(
        new ApiResponse(200,citylist,"City list")
    )
})


// Products
const getAllProducts = asyncHandler(async(req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = 10;

    const skip = (page - 1) * limit;

    const products = await Product.find().skip(skip).limit(limit);

    if (products.length === 0) {
        throw new ApiError(401, "No products to show");
    }

    const user = req.user;

    const productsWithStatus = products.map(product => {
        const isInWishlist = user.wishlist.some((item) => {
            return item._id.toString() === product._id.toString();
        });
        const isInCart = user.cart.some((item) => {
            return item.product._id.toString() === product._id.toString();
        });
        return {
            ...product.toObject(),
            inWishlist: isInWishlist,
            inCart: isInCart
        };
    });

    return res
    .status(200)
    .json(
        new ApiResponse(200, productsWithStatus, "Products fetched successfully")
    );
});


const getProduct = asyncHandler(async(req,res)=>{
    const product = await Product.findById(req.params.id)
    const user = req.user
    if(!product){
        throw new ApiError(404,product,"Product not found")
    }
    const isInWishlist = user.wishlist.some((item) =>{
        return item._id.toString() === product._id.toString()
    });
    const isInCart = user.cart.some((item) =>{
        return item.product._id.toString() === product._id.toString()
    });
    const productDetails = {
        product,
        inWishlist: isInWishlist,
        inCart: isInCart
    };
    const userHistory = await UserHistory.findOne({user: user._id})
    const existingIndex = userHistory.productsViewed.findIndex((p)=>{
        return p.product._id.toString() === product._id.toString()
    })
    if (existingIndex !== -1) {
        userHistory.productsViewed[existingIndex].count += 1
    }else{
        userHistory.productsViewed.push({
            product:product,
            count:1
        })
    }
    await userHistory.save();

    await CartAbandon.findOneAndUpdate(
        {user:user._id},
        {
            $inc: { timesPageViewed: 1 }
        },
        {
            upsert:true
        }
    )

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


const getProductsBySearch = asyncHandler(async(req, res) => {
    let searchQuery = req.query.name || '';
    searchQuery = searchQuery.trim().toLowerCase();
    if (!searchQuery) {
        throw new ApiError(400, 'Invalid search query');
    }
    const products = await Product.find({ name:{ $regex: new RegExp(searchQuery, 'i') }});
    if (products.length === 0) {
        throw new ApiError(404, 'Products not found');
    }
    const userHistory = await UserHistory.findOne({user: req.user._id})
    for(let i = 0 ; i<products.length ; i++){
        const existingIndex = userHistory.productsSearched.findIndex((p) => {
            return p._id.toString() === products[i]._id.toString()
        });
        if (existingIndex !== -1) {
            userHistory.productsSearched.splice(existingIndex, 1);
            userHistory.productsSearched.push(products[i]);
        }else{
            userHistory.productsSearched.push(products[i]);
        }
    }

    await userHistory.save()
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, products, 'Products searched successfully')
    );
});




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

    const review = await Review.create({
        user:user._id,
        product:productToBeReviewed._id,
        rating,
        comment
    })

    user.userReview.push(review._id)
    await user.save();

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
    productReviewToBeDeleted.avgRating = totalRatings !== 0 ? (totalRatingsSum / totalRatings).toFixed(2) : 0;

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
    await CartAbandon.findOneAndUpdate(
        {user:req.user._id},
        {
            $inc: { itemsAddedToCart: 1 }
        },
        {
            upsert:true
        }
    )

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
    await CartAbandon.findOneAndUpdate(
        {user:req.user._id},
        {
            $inc: { timescartViewed: 1 }
        },
        {
            upsert:true
        }
    )
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
    await CartAbandon.findOneAndUpdate(
        {user:req.user._id},
        {
            $inc: { itemsRemovedFromCart: 1 }
        },
        {
            upsert:true
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200,user.cart,"Item removed from Cart Successfully")
    )
})


const deleteCart = asyncHandler(async(req,res)=>{
    const user = req.user
    await CartAbandon.findOneAndUpdate(
        { user: user._id },
        { $inc: { itemsRemovedFromCart: user.cart.length } },
        { upsert: true }
    );
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


// Orders
const buyCartProducts = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id);
    const userHistory = await UserHistory.findOne({user: user._id})
    
    // console.log("user" ,user)
    let orderItems = [];
    let tax = 0.18;
    let totalPrice = 0;
    let productsinTransaction = []
    for(const item of user.cart){
        const productToBeOrdered = await Product.findById(item.product._id)
        productsinTransaction.push(productToBeOrdered.name)
        if(!productToBeOrdered){
            throw new ApiError(401,"Product not found")
        }
        
        const existingProductIndex = userHistory.productsPurchased.findIndex(p => p.product._id.toString() === productToBeOrdered._id.toString());

        if (existingProductIndex !== -1) {
            userHistory.productsPurchased.splice(existingProductIndex, 1);
        }

        userHistory.productsPurchased.push({
            product: productToBeOrdered.toObject(),
            addedAt: Date.now()
        });

        const {name,image,price} = productToBeOrdered;
        const singleOrderItem = {
            name:name,
            image:image,
            price:price,
            netprice:price*item.quantity,
            product:productToBeOrdered._id
        }
        //orderItems = [...orderItems,singleOrderItem];
        orderItems.push(singleOrderItem)
        productToBeOrdered.stock -= item.quantity;
        totalPrice += (price*item.quantity);
        productToBeOrdered.save();
    }
    await OrderTransaction.findOneAndUpdate(
        {},
        {
            $push: {
                transactionList: {
                    user: user._id,
                    products: productsinTransaction
                }
            }
        },
        { upsert: true }
    );
    await CartAbandon.findOneAndUpdate(
        {user:req.user._id},
        {
            $inc: { timesCheckoutConfirmed: 1 }
        },
        {
            upsert:true
        }
    )

    let subtotalPrice = totalPrice + (totalPrice*tax);
    const {paymentMethod} = req.body;
    const shippingInfo = await Shipping.findById(user.shippingInfo.toString())

    const order = await Order.create({
        user:req.user._id,
        orderItems:orderItems,
        totalProductPrice:totalPrice,
        subtotalPrice:subtotalPrice,
        paymentMethod:paymentMethod,
        shippingInfo:shippingInfo.toObject(),
    })

    if(!order){
        throw new ApiError(500,"Order not successfull")
    }

    user.orders.push(order)
    user.cart = [];
    //const notification = new Notification({ user: user._id, message: "Order Placed Successfully" });
    const notification1 = await Notification.create({
        user:user._id,
        message: "Order Placed Successfully"
    })
    user.notifications.push(notification1);

    if(paymentMethod === 'CashOnDelivery'){
        order.paymentStatus = 'Pending'
    }else{
        order.paymentStatus = 'Done'
    }
    await order.save();

    const notification2 = await Notification.create({
        user:user._id,
        message: `Payment Done Successfully`
    })
    user.notifications.push(notification2);
    await user.save();
    await userHistory.save();


    return res
    .status(200)
    .json(
        new ApiResponse(200,order,"Order Placed successfully")
    )

})


const checkoutInitialization = asyncHandler(async(req,res)=>{
    await CartAbandon.findOneAndUpdate(
        {user:req.user._id},
        {
            $inc: { timesCheckoutInitiated: 1 }
        },
        {
            upsert:true
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Checkout Initiated")
    )
})


const getMyOrders = asyncHandler(async(req,res)=>{
    const orders = await Order.find({ user: req.user._id, orderStatus: { $ne: "Delivered" } });
    return res
    .status(200)
    .json(
        new ApiResponse(200,orders,"Orders fetched Successfully")
    )
})


const getOrderHistory = asyncHandler(async(req,res)=>{
    const orders = await Order.find({ user: req.user._id, orderStatus: "Delivered" });
    return res
    .status(200)
    .json(
        new ApiResponse(200,orders,"Orders fetched Successfully")
    )
})


const buyAgainOrders = asyncHandler(async(req,res)=>{
    const user = req.user;
    const orderId = req.params.id;
    const orderToBeRepeated = await Order.findById(orderId)
    let cart = [];
    for (const item of orderToBeRepeated.orderItems) {
        const product = await Product.findById(item.product);
        cart.push({
            product: product.toObject(),
            quantity: item.netprice / item.price
        });
    }
    user.cart = [...user.cart, ...cart];    
    await user.save();
    return res
    .status(200)
    .json(
        new ApiResponse(200,cart,"Order Repeated Successfully")
    )
})



// Notification
const getAllNotications = asyncHandler(async(req,res)=>{
    const userNotifications = await Notification.find( {user: req.user._id })
    return res
    .status(200)
    .json(
        new ApiResponse(200,userNotifications,"Notifications fetched successfully")
    )
})


const getNotificationById = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    const notificationId = req.params.id;

    const notificationToBeRead = await Notification.findByIdAndUpdate(
        notificationId,
        { status: 'read' },
        { new: true }
    );

    if (!notificationToBeRead) {
        throw new ApiError(404, "Notification not found");
    }
    const user = await User.findById(userId);
    const notificationIndex = user.notifications.findIndex(notification => notification._id.equals(notificationToBeRead._id));

    if (notificationIndex !== -1) {
        user.notifications[notificationIndex].status = 'read';
        user.markModified('notifications');
        await user.save();
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, notificationToBeRead, "Notification read successfully")
    );
});


const deleteNotificationById = asyncHandler(async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        return res.status(200).json(new ApiResponse(200, {}, "Notification deleted successfully"));
    } catch (error) {
        throw new ApiError(500,"Problem in deleting a notification")
    }
});

const deleteAllNotifications = asyncHandler(async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user._id });
        return res.status(200).json(new ApiResponse(200, {}, "Notifications deleted successfully"));
    } catch (error) {
        throw new ApiError(500,"Problem in deleting notifications")
    }
});





export {
    startSession,
    endSession,
    registerUser,
    loginUser,
    updateUserProfile,
    updateShippingDetails,
    getShippingDetails,
    getProfile,
    getDetails,
    getCityCountryProfileList,
    logoutUser,
    getAllProducts,
    getProduct,
    getProductsByCategory,
    getProductsBySearch,
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
    checkoutInitialization,
    getMyOrders,
    getOrderHistory,
    buyAgainOrders,
    getAllNotications,
    getNotificationById,
    deleteAllNotifications,
    deleteNotificationById,
}