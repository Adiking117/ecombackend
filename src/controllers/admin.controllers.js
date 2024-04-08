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
    const user = await User.find({role:{ $nin: ["superadmin"] }}).select("-password");
    // console.log("USers in db",user)
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
    const user = await User.findById( { _id:req.params.id } ).select("-password");
    console.log("user found",user)
    if(!user){
        throw new ApiError(404,"USer Not forund")
    }
    if(user.role === 'superadmin'){
        throw new ApiError(401,"You cannot view superadmin")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,`${user.userName} details fetched successfully`)
    )
})

// make another user a admin 
const makeUserAdmin = asyncHandler(async(req,res)=>{
    const userTobeAdmin = await User.findById(req.params.id).select("-password")
    console.log("userTobeAdmin",userTobeAdmin)
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


const makeAdminUser = asyncHandler(async(req,res)=>{
    const adminToBeUser = await User.findById(req.params.id).select("-password")
    if(!adminToBeUser){
        throw new ApiError(400,"USer doesnt exist")
    }
    // await userTobeAdmin.role = 'admin'
    adminToBeUser.role = 'user'
    adminToBeUser.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,adminToBeUser,"Admin updated successfully")
    )
})

// delete user
const deleteUser = asyncHandler(async(req,res)=>{
    const userToBeDeleted = await User.findById(req.params.id);
    console.log("userToBeDeleted", userToBeDeleted);
    
    if(!userToBeDeleted){
        throw new ApiError(404, "User not found");
    }
    if(userToBeDeleted._id.equals(req.user._id)) {
        throw new ApiError(401, "You cannot delete your own account");
    }
    if(req.user.role === "admin" && userToBeDeleted.role === "admin") {
        throw new ApiError(401, "Only superadmins can delete other admins");
    }
    if(userToBeDeleted.role === "superadmin") {
        throw new ApiError(401, "You cannot delete a superadmin");
    }
    await User.findByIdAndDelete(userToBeDeleted._id);
    return res
    .status(200)
    .json(
        new ApiResponse(200, "User deleted successfully")
    );
});


// add gallery images , view image , view all images , delete images
const addGalleryImages = asyncHandler(async(req,res)=>{
    console.log("req.files",req.files)
    const imageLocalPath = req.files.image[0].path;
    if(!imageLocalPath){
        throw new ApiError(400,"Image not found")
    }
    const image = await uploadOnCloudinary(imageLocalPath)
    if(!image){
        throw new ApiError(400,"Image requried")
    }
    console.log("image",image)
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
    const image = await Gallery.findById(req.params.id)
    // console.log("image by id",image)
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
    const imageToBeDeleted = await Gallery.findById(req.params.id)

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



// add products , view products , view product by id -> update products , delete products , get product reviews
const addProducts = asyncHandler(async(req,res)=>{
    const { name,price,description,stock,category } = req.body;
    if(!name || !price || !description || !stock || !category){
        throw new ApiError(401,"Fill All the details")
    }
    const imageLocalPath = req.files?.image[0]?.path
    if(!imageLocalPath){
        throw new ApiError(401,"Image not found")
    }
    const image = await uploadOnCloudinary(imageLocalPath)
    if(!image){
        throw new ApiError(401,"Image required")
    }

    const product = await Product.create({
        name,
        price,
        description,
        image:image.url,
        stock,
        category,
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,product,"Product Added Successsfully")
    )
})


const viewAllProducts = asyncHandler(async(req,res)=>{
    const products = await Product.find();
    if(products.length===0){
        throw new ApiError(401,"No products Found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,products,"All products fetched Successfully")
    )
})


const viewProduct = asyncHandler(async(req,res)=>{
    const product = await Product.findById( {_id:req.params.id })
    if(!product){
        throw new ApiError(401,"No product Found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,product,"Product fetched Successfully")
    )
})


const updateProductDetails = asyncHandler(async(req,res)=>{
    const { name,price,description,stock,category } = req.body
    const {id} = req.params
    //console.log("req.body",req.body,"req.params.id",req.params.id)
    const updateFields = {};
    if (name) updateFields.name = name;
    if (price) updateFields.price = price;
    if (description) updateFields.description = description;
    if (stock) updateFields.stock = stock;
    if (category) updateFields.category = category;

    const productToBeUpdated = await Product.findByIdAndUpdate(
        id,
        {
            $set:updateFields
        },
        {
            new:true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,productToBeUpdated,"Product Details updated successfully")
    )
})


const updateProductImage = asyncHandler(async(req,res)=>{
    const imageLocalPath = req.files?.image[0].path;
    const {id} = req.params
    // console.log("req.files",req.files.image[0].path)
    // console.log("id of product",id)
    if(!imageLocalPath){
        throw new ApiError(401,"Image not found")
    }
    const updatedImage = await uploadOnCloudinary(imageLocalPath)
    if(!updatedImage.url){
        throw new ApiError(500,"Image cannot be uplaoded")
    }
    // console.log("updated image",updatedImage)
    const produtImageToBeUpdated = await Product.findByIdAndUpdate(
        id,
        {
            $set:{
                image:updatedImage.url
            }
        },
        {
            new:true
        }
    )
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,produtImageToBeUpdated,"Product Image Updated successfully")
    )
})


const deleteProduct = asyncHandler(async(req,res)=>{
    const productToBeDeleted = await Product.findById(req.params.id)
    if(!productToBeDeleted){
        throw new ApiError(401,"Product Not found")
    }
    await Product.findByIdAndDelete(productToBeDeleted._id)

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Product Deleted Succeessfully")
    )
})


const getProductReviews = asyncHandler(async(req,res)=>{
    const productReviews = await Product.findById(req.params.id)
    if(!productReviews){
        throw new ApiError(401,"Product not found")
    }
    const allReviews = productReviews.reviews;
    return res
    .status(200)
    .json(
        new ApiResponse(200,allReviews,"Reviews fetched successfully")
    )
})


// get all orders , get a order , complete order



export{
    getAllUser,
    getUser,
    makeUserAdmin,
    makeAdminUser,
    deleteUser,
    addGalleryImages,
    deleteGalleryImage,
    viewGalleryImage,
    viewGalleryImages,
    addProducts,
    viewAllProducts,
    viewProduct,
    updateProductDetails,
    updateProductImage,
    deleteProduct,
    getProductReviews
}