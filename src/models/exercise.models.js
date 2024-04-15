import mongoose from 'mongoose'

const exerciseSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    bodyPart:{
        type:[String],
        required:true
    },
    description:{
        type:String,
        required:true
    },
    instructions:{
        type:String,
        required:true
    },
    exerciseGoal:{
        type:[String],
        required:true
    },
    exerciseGif:{
        type:String,
        required:true
    } 
},{timestamps:true})

export const Exercise = mongoose.model("Exercise",exerciseSchema)