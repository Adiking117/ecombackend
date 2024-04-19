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
import { OTP } from "../models/otp.models.js"
import nodemailer from 'nodemailer';
import {google} from 'googleapis'
import { redirectURL } from "../constants.js"

const CLIENT_ID = process.env.GCLIENTID
const CLEINT_SECRET = process.env.GCLIENTSECRET
const REDIRECT_URI = redirectURL
const REFRESH_TOKEN = process.env.GREFRESHTOKEN

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });


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


const getAssignedOrders = asyncHandler(async(req,res)=>{
    const orders = req.user.orders
    return res
    .status(200)
    .json(
        new ApiResponse(200,orders,"Orders fetched Successfully")
    )
})


const getDeliveredOrdersHistory = asyncHandler(async(req,res)=>{
    const orders = req.user.orderHistory
    return res
    .status(200)
    .json(
        new ApiResponse(200,orders,"Orders fetched Successfully")
    )
})


const sendOtpToUser = asyncHandler(async(req,res)=>{
    const emp = req.user;
    const order = await Order.findById(req.params.id).populate('user','email')
    const otp = Math.floor(100000 + Math.random() * 900000);
    const newOTP = await OTP.create({
        user:order.user._id,
        email:order.user.email,
        otp:otp
    })
    await newOTP.save();

    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: 'dbmongo117@gmail.com',
          clientId: CLIENT_ID,
          clientSecret: CLEINT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
        },
    });

    const mail = {
        from: 'dbmongo117@gmail.com',
        to: order.user.email,
        subject: 'OTP for Order Confirmation',
        text: `Your OTP for order confirmation is: ${otp}`,
    };

    await transport.sendMail(mail);

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Otp send successffuly")
    )

})


const otpVerification = asyncHandler(async(req,res)=>{
    const { otp } = req.body;
    const order = await Order.findById(req.params.id).populate('user','email')
    const otpRecord = await OTP.findOne({ email: order.user.email , otp });

    if (!otpRecord) {
        throw new ApiError(400,"Invalid OTP")
    }
    if (otpRecord.createdAt < new Date(Date.now() - 5 * 60 * 1000)) {
        throw new ApiError(400,"OTP expired")
    }

    order.orderStatus = 'Approved';
    await order.save();

    if(order.paymentMethod === 'CashOnDelivery'){
        order.paymentStatus = 'Done'
    }

    const emp = req.user;
    const orderIndex = emp.orders.findIndex((o)=>{
        return o._id === order._id
    })
    await emp.orders.splice(orderIndex,1)
    await emp.orderHistory.push(order)
    await emp.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Order Approved")
    )
})


export{
    requestAdminForEmployement,
    getAssignedOrders,
    getDeliveredOrdersHistory,
    sendOtpToUser,
    otpVerification
}

