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
import { Greviences } from "../models/greviences.models.js"


const requestAdminForEmployement = asyncHandler(async(req,res)=>{
    const { message,gtype } = req.body;
    const user = req.user;
    
    const request = await Greviences.create(
        {
            user :user._id,
            gtype,
            message,
        }
    )

    await request.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,request,"Applied for Job successfully")
    )
})


const sendOtpToUser = asyncHandler(async(req,res)=>{
    
})


const otpVerification = asyncHandler(async(req,res)=>{

})


export{
    requestAdminForEmployement,
    sendOtpToUser,
    otpVerification
}

