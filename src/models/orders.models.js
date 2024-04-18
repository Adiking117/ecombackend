import mongoose from "mongoose";

const singleOrderItemSchema = new mongoose.Schema({
    name:{
        type:String
    },
    image:{
        type:String
    },
    price:{
        type:Number
    },
    netprice:{
        type:Number
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    }
},{timestamps:true})

const orderSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.ObjectId,
        ref:"User"
    },
    orderItems: [
        singleOrderItemSchema
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
        enum:["Placed","Shipping","Approved","Delivered"],
        default:"Placed"
    },
    shippingInfo:{
        type: mongoose.Schema.Types.Mixed,
        ref:"Shipping"
    },
    deliveredAt: {
        type:Date,
    },
    deliveredBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{
    timestamps:true
})

export const Order = mongoose.model("Order",orderSchema)