import mongoose from 'mongoose'

const gallerySchema = new mongoose.Schema({
    imgurl:{
        type:String,
        required:true
    }
},{timestamps:true})

export const Gallery = mongoose.model("Gallery",gallerySchema)