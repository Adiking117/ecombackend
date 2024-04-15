import mongoose from "mongoose";

const userHistorySchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    productsPurchased:[
        {
            type:mongoose.Schema.Types.Mixed,
            ref:"Product"
        }
    ],
    productsViewed:[
        {
            product:{
                type:mongoose.Schema.Types.Mixed,
                ref:"Product"
            },
            count:{
                type:Number,
            }
        }
    ],
    productsSearched:[
        {
            type:mongoose.Schema.Types.Mixed,
            ref:"Product"
        }
    ],
    recommendedByAdmin:[
        {
            type:mongoose.Schema.Types.Mixed,
            ref:"Product"
        }
    ],
    startTime: {
        type: Date,
    },
    endTime: {
        type: Date
    },
    sessionDuration: {
        type: Number
    }
},{
    timestamps:true
})


export const UserHistory = mongoose.model("UserHistory",userHistorySchema)