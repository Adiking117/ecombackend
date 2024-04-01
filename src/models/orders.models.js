import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.ObjectId,
        ref:"User"
    },
    products:[
        {
            type:mongoose.Schema.Types.Mixed,
            ref:"Product" 
        }
    ],
    totalProductPrice:{
        type:Number,
    },
    subtotalPrice:{
        type:Number,
    },
    paymentMethod:{
        type:String,
        enum:["UPI","CashOnDelivery","Card","NetBanking"],
        default:"CashOnDelivery"
    },
    paymentStatus:{
        type:String,
        enum:["Pending","Done"],
        default:"Pending"
    },
    orderStatus:{
        type:String,
        enum:["Placed","Delivered"],
        default:"Placed"
    },
    shippingInfo:{
        type: mongoose.Schema.Types.Mixed,
        ref:"Shipping"
    },
    deliveredAt: {
        type:Date
    },
},{
    timestamps:true
})

export const Order = mongoose.model("Order",orderSchema)