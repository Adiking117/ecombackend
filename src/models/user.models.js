import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    userName:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    firstName:{
        type:String,
        required:true,
    },
    lastName:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    cart:[
        {
            type:mongoose.Schema.Types.Mixed,
            ref:"Product"
        }
    ],
    wishlist:[
        {
            type:mongoose.Schema.Types.Mixed,
            ref:"Product" 
        }
    ],
    orders:[
        {
            type:mongoose.Schema.Types.Mixed,
            ref:"Order" 
        }
    ],
    orderHistory:[
        {
            type:mongoose.Schema.Types.Mixed,
            ref:"Order"
        }
    ],
    refreshToken:{
        type:String
    },
    role:{
        type:String,
        enum:['user','admin'],
        default: 'user'
    },
},{
    timestamps:true
})


userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password,10)
})

userSchema.methods.isPasswordValid = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            userName : this.userName,
            email : this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User",userSchema)