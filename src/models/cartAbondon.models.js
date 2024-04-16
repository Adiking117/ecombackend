import mongoose from 'mongoose'

const cartAbandonSchema = new mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    userName:{
        type:String
    },
    age:{
        type:Number
    },
    gender:{
        type:String
    },
    cartNow:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product"
            },
            addedTime:{
                type:Date
            },
        }
    ],
    cartPrice:{
        type:Number
    },
    cartHistory:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product"
            },
            exitTime:{
                type:Date
            },
            totalTime:{
                type:Date
            }
        }
    ]
},{
    timestamps:true
})

export const CartAbandon = mongoose.model("CartAbandon",cartAbandonSchema)