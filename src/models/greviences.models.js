import mongoose from "mongoose";

const grevienceSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    gtype:{
        type:String,
        enum:["employement_request","customer_care"],
    },
    message:{
        type:String
    }
},{
    timestamps:true
}
)

export const Greviences = mongoose.model("Greviences",grevienceSchema)