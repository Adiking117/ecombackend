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
    avgRating:{
        type:Number,
        default:0
    },
    reviews:[
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            },
            rating:{
                type:Number,
                default:0
            },
            comment:{
                type:String
            },
        }
    ],
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
        default:0
    }
},{timetsamps:true})

export const Product = mongoose.model("Product",productSchema)