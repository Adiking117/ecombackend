import mongoose from 'mongoose'

const profileSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
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
        enum:["bulk","cut","lean"],
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
    state:{
        type:String,
    },
    city:{
        type:String,
        required:true
    },
    bp:{
        type:Number
    },
    bpLevel:{
        type:String,
        enum:["Low","Normal","High"]
    },
    diabetes:{
        type:Number
    },
    diabetesLevel:{
        type:String,
        enum:["Low","Normal","High"]
    },
    cholesterol:{
        type:Number
    },
    cholesterolLevel:{
        type:String,
        enum:["Low","Normal","High"]
    }
},{timestamps:true})


export const Profile = mongoose.model("Profile",profileSchema)