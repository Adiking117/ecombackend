import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Product } from './products.models.js'

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
            product: {
                type: mongoose.Schema.Types.Mixed,
                ref: "Product"
            },
            quantity: {
                type: Number,
                default: 1
            }
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
        enum:['user','employee','admin','superadmin'],
        default: 'user'
    },
    notifications:[
        {
            type:mongoose.Schema.Types.Mixed,
            ref:"Notification"
        }
    ],
    shippingInfo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Shipping"
    },
    userProfile:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Profile"
    },
    userHistory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"UserHistory"
    },
    userReview:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Review"
        }
    ]
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

userSchema.methods.addToCart = async function(productId) {
    const productToAdd = await Product.findById(productId);

    const itemExistOrNot = this.cart.findIndex((item) => {
        return item.product._id.toString() === productId
    });
    if (itemExistOrNot !== -1) {
        this.cart[itemExistOrNot].quantity++;
    } else {
        this.cart.push({ product: productToAdd.toObject(), quantity: 1 });
    }
    await this.save();
};

userSchema.methods.addQty = async function(productId) {
    const itemExistOrNot = this.cart.findIndex((item) => {
        return item.product._id.toString() === productId
    });
    if (itemExistOrNot !== -1) {
        this.cart[itemExistOrNot].quantity++;
    }
    await this.save();
};

userSchema.methods.subQty = async function(productId){
    const itemExistOrNot = this.cart.findIndex((item)=>{
        return item.product._id.toString() === productId
    });
    if(itemExistOrNot !== -1){
        this.cart[itemExistOrNot].quantity--;
        if(this.cart[itemExistOrNot].quantity <= 0){
            this.cart.splice(itemExistOrNot,1)
        }
    }
    await this.save();
}

userSchema.methods.deleteFromCart = async function(productId){
    const itemExistOrNot = this.cart.findIndex((item)=>{
        return item.product._id.toString() === productId
    });
    //console.log("itemexist",itemExistOrNot)
    if(itemExistOrNot !== -1){
        this.cart.splice(itemExistOrNot,1)
    }
    await this.save();
}

userSchema.methods.deleteFromWishlist = async function(productId){
    const itemExistOrNot = this.wishlist.findIndex((item)=>{
        return item._id.toString() === productId
    });
    //console.log("itemexist",itemExistOrNot)
    if(itemExistOrNot !== -1){
        this.wishlist.splice(itemExistOrNot,1)
    }
    await this.save();
}


export const User = mongoose.model("User",userSchema)