import { User } from "../models/user.models.js"
import { Profile } from "../models/profile.models.js"
import { Gallery } from "../models/gallery.models.js"
import { Product } from "../models/products.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

// get all users , get a user detail
const getAllUser = asyncHandler(async(req,res)=>{
    const user = await User.find().select("-password");
    console.log("USers in db",user)
    if(user.length === 0){
        throw new ApiError(404,"User not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"All Users fetched Successfully")
    )
})


const getUser = asyncHandler(async(req,res)=>{
    const user = await User.find( { _id:req.params.id } ).select("-password");
    console.log("user found",user)
    if(!user){
        throw new ApiError(404,"USer Not forund")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,`${user.userName} details fetched successfully`)
    )
})

// make another user a admin 
const makeUserAdmin = asyncHandler(async(req,res)=>{
    const userTobeAdmin = await User.findById({ _id: req.params.id }).select("-password")
    //console.log("userTobeAdmin",userTobeAdmin)
    if(!userTobeAdmin){
        throw new ApiError(400,"USer doesnt exist")
    }
    // await userTobeAdmin.role = 'admin'
    userTobeAdmin.role = 'admin'
    userTobeAdmin.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,userTobeAdmin,"Admin updated successfully")
    )

})

// delete user
const deleteUser = asyncHandler(async(req,res)=>{
    const userToBeDeleted = await User.findById({_id:req.params.id})
    console.log("userTobe dleeted",userToBeDeleted)
    if(!userToBeDeleted){
        throw new ApiError(400,"User doesnt exist")
    }
    if(userToBeDeleted.role ==='admin'){
        throw new ApiError(401,"You cant delete admin")
    }
    await User.findByIdAndDelete(userToBeDeleted._id)
    return res
    .status(200)
    .json(
        new ApiResponse(200,"User deleted Successfully")
    )
})

// add gallery images , view image , view all images , delete images
const addGalleryImages = asyncHandler(async(req,res)=>{
    console.log(req.files)
    const imageLocalPath = req.files.image[0].path;
    if(!imageLocalPath){
        throw new ApiError(400,"Image not found")
    }
    const image = await uploadOnCloudinary(imageLocalPath)
    if(!image){
        throw new ApiError(400,"Image requried")
    }
    const addedImage = await Gallery.create({
        imgurl : image.url
    })
    if(!addedImage){
        throw new ApiError(500,"Error while uplaoding image")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,addedImage,"Image Added successfully")
    )
})


const viewGalleryImages = asyncHandler(async(req,res)=>{
    const images = await Gallery.find();
    if(!images){
        throw new ApiError(404,"Images not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,images,"Images Fetched Successfully")
    )
})


const viewGalleryImage = asyncHandler(async(req,res)=>{
    const image = await Gallery.find({_id:req.params.id})
    if(!image){
        throw new ApiError(401,"Image cant be found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,image,"Image Showing")
    )
})


const deleteGalleryImage = asyncHandler(async(req,res)=>{
    const imageToBeDeleted = await Gallery.findById({ _id:req.params.id })

    console.log("type of to be deleted",typeof(imageToBeDeleted))

    console.log("image to be deleted",imageToBeDeleted)
    if(!imageToBeDeleted){
        throw new ApiError(404,"Image Not found")
    }
    await Gallery.findByIdAndDelete(imageToBeDeleted._id)
    return res
    .status(200)
    .json(
        new ApiResponse(200,"Image Deleted Succeessfully")
    )
})



// add products , update products , delete products , get product reviews

// get all orders , get a order , complete order



export{
    getAllUser,
    getUser,
    addGalleryImages,
    deleteGalleryImage,
    viewGalleryImage,
    viewGalleryImages,
    makeUserAdmin,
    deleteUser
}