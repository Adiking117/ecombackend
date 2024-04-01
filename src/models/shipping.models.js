import mongoose, { mongo } from 'mongoose'

const shippingSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    address:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    pincode:{
        type:Number,
        required:true
    },
    phoneNo:{
        type:Number,
        required:true
    },
},
{
    timestamps:true
})

export const Shipping = mongoose.model("Shipping",shippingSchema)