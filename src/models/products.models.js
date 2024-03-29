import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    rating:{
        type:Number,
        required:true
    },
    review:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    reviewNum:{
        type:Number,
        required:true
    }
},{timetsamps:true})

export const Product = mongoose.model("Product",productSchema)