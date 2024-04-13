import { User } from "../models/user.models.js"
import { Profile } from "../models/profile.models.js"
import { Shipping } from "../models/shipping.models.js"
import { Gallery } from "../models/gallery.models.js"
import { Product } from "../models/products.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js"
import { Order } from "../models/orders.models.js"
import { UserDetails } from "../models/userDetails.models.js"
import excel from 'exceljs';
import { Notification } from "../models/notifications.models.js"
import * as fs from 'fs';
import { fileLocation } from "../filelocation.js"
import { Exercise } from "../models/exercise.models.js"



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
    if(!imageToBeDeleted){
        throw new ApiError(404,"Image Not found")
    }
    await deleteFromCloudinary(imageToBeDeleted.imgurl);

    await Gallery.findByIdAndDelete(imageToBeDeleted._id)
    return res
    .status(200)
    .json(
        new ApiResponse(200,"Image Deleted Succeessfully")
    )
})


// exercises
const addExercises = asyncHandler(async(req,res)=>{
    const { name,description,instructions,exerciseGoal,bodyPart } = req.body;
    if(!name || !description || !instructions || !exerciseGoal || !bodyPart){
        throw new ApiError(401,"Fill All the details")
    }
    const gifLocalPath = req.files?.exerciseGif[0]?.path
    if(!gifLocalPath){
        throw new ApiError(401,"Image not found")
    }
    const videoGif = await uploadOnCloudinary(gifLocalPath)
    if(!videoGif){
        throw new ApiError(401,"Gif required")
    }

    const exercise = await Exercise.create({
        name,
        bodyPart,
        description,
        instructions,
        exerciseGoal,
        exerciseGif:videoGif.url
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,exercise,"Exercise Added Successsfully")
    )
})


const veiwAllExercises = asyncHandler(async(req,res)=>{
    const exercises = await Exercise.find();
    if(exercises.length===0){
        throw new ApiError(401,"No exercises Found")
    }
    console.log(exercises)
    return res
    .status(200)
    .json(
        new ApiResponse(200,exercises,"All exercises fetched Successfully")
    )
})


const viewExercise = asyncHandler(async(req,res)=>{
    const exercise = await Exercise.findById(req.params.id)
    if(!exercise){
        throw new ApiError(40,"Exercise not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,exercise,"Exercise fetched succesfully")
    )
})


const deleteExercise = asyncHandler(async(req,res)=>{
    const exerciseToBeDeleted = await Exercise.findById(req.params.id)
    await deleteFromCloudinary(exerciseToBeDeleted.exerciseGif)
    await Exercise.findByIdAndDelete(exerciseToBeDeleted._id)
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Exercise Deleted successfully")
    )
})


// add products , view products , view product by id -> update products , delete products , get product reviews
const addProducts = asyncHandler(async(req,res)=>{
    const { name,price,description,stock,category,weight,productGoal } = req.body;
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
        weight,
        productGoal
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

    await deleteFromCloudinary(productToBeDeleted.image);

    await Product.findByIdAndDelete(productToBeDeleted._id)

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Product Deleted Succeessfully")
    )
})


const getProductReviews = asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId).populate('reviews.user', 'userName firstName lastName');
    if (!product) {
        throw new ApiError(404, "Product not found");
    }
    const allReviews = product.reviews.map(review => {
        return {
            reveiwId: review._id,
            userId: review.user._id,
            userName: review.user.userName,
            firstName: review.user.firstName,
            lastName: review.user.lastName,
            rating: review.rating,
            comment: review.comment
        };
    });
    return res.status(200).json(
        new ApiResponse(200, allReviews, "Reviews fetched successfully")
    );
});



// get all orders , get a order , complete order
const getAllOrders = asyncHandler(async(req,res)=>{
    const orders = await Order.find().populate('user', 'firstName lastName');
    const ordersWithUserDetails = orders.map(order => {
        return {
            _id: order._id,
            order
        };
    });
    return res
    .status(200)
    .json(
        new ApiResponse(200, ordersWithUserDetails, "Orders fetched successfully")
    );
});


const getPlacedOrders = asyncHandler(async(req,res)=>{
    const placedOrders = await Order.find( {orderStatus : "Placed"} ).populate('user', 'firstName lastName');
    return res
    .status(200)
    .json(
        new ApiResponse(200,placedOrders,"Placed Orders fetched successfully")
    )
})


const getDeliveredOrders = asyncHandler(async(req,res)=>{
    const deliveredOrders = await Order.find( {orderStatus : "Delivered"} ).populate('user', 'firstName lastName');
    return res
    .status(200)
    .json(
        new ApiResponse(200,deliveredOrders,"Delivered Orders fetched successfully")
    )
})


const getOrder = asyncHandler(async(req,res)=>{
    const order = await Order.findById(req.params.id).populate('user', 'firstName lastName');
    if(!order){
        throw new ApiError(404,"Order not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,order,"Order fetched succesdfuly")
    )
})


const giveOrderDeliveryDays = asyncHandler(async(req,res)=>{
    const { days } = req.body;
    const order = await Order.findById(req.params.id)
    const userId = order.user;
    const user = await User.findById(userId)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    order.deliveredAt = deliveryDate;

    await order.save();

    const notification = await Notification.create({
        user:userId,
        message: `Your Order is confirmed and will be delivered in ${days} days at ${order.deliveredAt}`
    })
    user.notifications.push(notification);
    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Notification sent successfully")
    )
})


const completeOrder = asyncHandler(async(req,res)=>{
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }
    order.orderStatus = 'Delivered';
    await order.save();

    const userId = order.user;
    const user = await User.findById(userId);
    if(!user) {
        throw new ApiError(404, "User not found");
    }

    const userProfile = await Profile.findById(user.userProfile.toString())
    const shippingProfile = await Shipping.findById(user.shippingInfo.toString())
    const productsId = order.orderItems.map(item => item.product)
    let products = [];
    for(const id of productsId){
        const product = await Product.findById(id);
        products.push(product.name)
    }

    const userDetails = new UserDetails({
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        gender: userProfile.gender,
        city: userProfile.city,
        country: userProfile.country,
        age: userProfile.age,
        height: userProfile.height,
        weight: userProfile.weight,
        goal: userProfile.goal, 
        phone: shippingProfile.phoneNo,
        products:products
    });
    await userDetails.save();

    const excelFileName = 'user_details.xlsx';
    const excelFilePath = `${fileLocation}/${excelFileName}`;

    await appendUserDetailsToExcel(user, userProfile, shippingProfile, products, excelFilePath);


    // const notification = await Notification.create({
    //     user:user._id,
    //     message:`Order Delivered Successfully`
    // })
    // user.notifications.push(notification);


    const orderIndex = user.orders.findIndex((order)=>{
        return order._id.toString() === orderId
    })
    if(orderIndex !== -1){
        user.orders[orderIndex].status = 'Delivered'
    }

    user.orderHistory.push(order);

    const index = user.orders.findIndex(userOrder => userOrder._id.toString() === orderId);
    if(index !== -1) {
        user.orders.splice(index, 1);
    }

    await user.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Order completed successfully")
    );
});


const appendUserDetailsToExcel = async (user, userProfile, shippingProfile, products, excelFilePath) => {
    const workbook = new excel.Workbook();
    let worksheet;
    try {
        await workbook.xlsx.readFile(excelFilePath);
        worksheet = workbook.getWorksheet('UserDetails');
    } catch (error) {
        worksheet = workbook.addWorksheet('UserDetails');
        worksheet.addRow([
            'First Name',
            'Last Name',
            'Email',
            'Age',
            'Height',
            'Weight',
            'Gender',
            'Goal',
            'City',
            'Country',
            'Phone',
            'Product'
        ]);
    }
    for (const product of products) {
        worksheet.addRow([
            user.firstName,
            user.lastName,
            user.email,
            userProfile.age,
            userProfile.height,
            userProfile.weight,
            userProfile.gender,
            userProfile.goal,
            userProfile.city,
            userProfile.country,
            shippingProfile.phoneNo,
            product
        ]);
    }
    await workbook.xlsx.writeFile(excelFilePath);
};



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
    addExercises,
    veiwAllExercises,
    viewExercise,
    deleteExercise,
    addProducts,
    viewAllProducts,
    viewProduct,
    updateProductDetails,
    updateProductImage,
    deleteProduct,
    getProductReviews,
    getAllOrders,
    getOrder,
    getPlacedOrders,
    getDeliveredOrders,
    giveOrderDeliveryDays,
    completeOrder
}