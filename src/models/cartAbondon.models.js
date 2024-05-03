import mongoose from 'mongoose'

const cartAbandonSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    itemsAddedToCart:{
        type:Number,
        default:0
    },
    itemsRemovedFromCart:{
        type:Number,
        default:0
    },
    timescartViewed:{
        type:Number,
        default:0
    },
    timesCheckoutConfirmed:{
        type:Number,
        default:0
    },
    timesCheckoutInitiated:{
        type:Number,
        default:0
    },
    timesLogIn:{
        type:Number,
        default:0
    },
    timesPageViewed:{
        type:Number,
        default:0
    },
    createdAt: {
        type: Date,
        expires: 1209600,
        default: Date.now
    }   
},{
    timestamps:true
})

export const CartAbandon = mongoose.model("CartAbandon",cartAbandonSchema)