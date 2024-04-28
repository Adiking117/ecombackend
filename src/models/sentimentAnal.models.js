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