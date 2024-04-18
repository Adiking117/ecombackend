import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    email:{
        type:String
    },
    otp:{
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5,
    },
}
)

export const OTP = mongoose.model("OTP",otpSchema)