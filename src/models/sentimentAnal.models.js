import mongoose from 'mongoose'

const reviewSentSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    },
    review:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Review"
    },
    rating:{
        type:Number
    },
    comment:{
        type:String
    }
},{
    timestamps:true
})

export const ReviewSentiment = mongoose.model("ReviewSentiment",reviewSentSchema)