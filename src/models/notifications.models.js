import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    message:{
        type:String,
    },
    status:{
        type:String,
        enum:["read","unread"],
        default:"unread"
    }
},{
    timestamps:true
})

export const Notification = mongoose.model("Notification",notificationSchema)