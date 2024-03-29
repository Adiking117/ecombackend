import mongoose from 'mongoose'

const profileSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.Mixed,
        ref:"User"
    },
    age:{
        type:Number,
        required:true
    },
    height:{
        type:Number,
        required:true
    },
    weight:{
        type:Number,
        required:true
    },
    goal:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    country:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    }
},{timestamps:true})


export const Profile = mongoose.model("Profile",profileSchema)