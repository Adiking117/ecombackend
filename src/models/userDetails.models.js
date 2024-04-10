import mongoose from 'mongoose';

const userDetailsSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    first_name: {
        type: String,
    },
    last_name: {
        type: String,
    },
    email: {
        type: String,
    },
    age: {
        type: Number
    },
    height: {
        type: Number
    },
    weight: {
        type: Number
    },
    gender: {
        type: String
    },
    goal: {
        type: String
    },
    city: {
        type: String
    },
    country: {
        type: String
    },
    phone: {
        type: Number
    },
    products: {
        type: [String] 
    },
}, {
    timestamps: true
});

export const UserDetails = mongoose.model('UserDetails', userDetailsSchema);
