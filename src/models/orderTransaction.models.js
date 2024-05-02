import mongoose from 'mongoose';

const orderTransactionList = new mongoose.Schema({
    transactionList : [
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            },
            products:[
                String
            ]
        }
    ],

},
{
    timestamps:true
})

export const OrderTransaction = mongoose.model("OrderTransaction",orderTransactionList)