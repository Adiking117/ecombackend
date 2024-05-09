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
import { fileLocation,recommendations } from "../filelocation.js"
import { Exercise } from "../models/exercise.models.js"
import { Greviences } from "../models/greviences.models.js"
import { Review } from "../models/review.models.js"
import { spawn } from 'child_process';
import { UserHistory } from "../models/userHistory.models.js"
import cron from 'node-cron';
import { WebsiteChurn } from "../models/websiteChurn.models.js"
import { ReviewSentiment } from "../models/sentimentAnal.models.js"
import mongoose from "mongoose"
import { CartAbandon } from "../models/cartAbondon.models.js"
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
    // console.log("user found",user)
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
    const page = parseInt(req.query.page) || 1; 
    const limit = 5;

    const skip = (page - 1) * limit;

    const products = await Product.find().skip(skip).limit(limit);
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
    
    console.log(productId)
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


const getShippingOrders = asyncHandler(async(req,res)=>{
    const shippingOrders = await Order.find( {orderStatus : "Shipping"} ).populate('user', 'firstName lastName');
    return res
    .status(200)
    .json(
        new ApiResponse(200,shippingOrders,"Shipping Orders fetched successfully")
    )
})


const getApprovedOrders = asyncHandler(async(req,res)=>{
    const approvedOrders = await Order.find( {orderStatus : "Approved"} ).populate('user', 'firstName lastName');
    return res
    .status(200)
    .json(
        new ApiResponse(200,approvedOrders,"Approved Orders fetched successfully")
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

    // console.log(products)

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



// employee
const viewGreviences = asyncHandler(async(req,res)=>{
    const greviences = await Greviences.find().populate('user',"firstName lastName");
    return res
    .status(200)
    .json(
        new ApiResponse(200,greviences,"All Greviences Fetched successfully")
    )
})


const viewUserGrevience = asyncHandler(async(req,res)=>{
    const grevience = await Greviences.findById(req.params.id).populate('user','firstName lastName');
    return res
    .status(200)
    .json(
        new ApiResponse(200,grevience,"Grevience Fetched successfully")
    )
})


const responseForEmployement = asyncHandler(async(req,res)=>{
    const grevience = await Greviences.findById(req.params.id).populate('user','userName role');
    const { answer } = req.body;
    let message;
    console.log(grevience)
    if(answer === "Yes"){
        grevience.user.role = 'employee'
        message = "Congratulation you are slected for Job"
    }else{
        message = "Your Aplication was not afftedcted"
    }

    await Notification.create({
        user:grevience.user._id,
        message: message
    })

    grevience.user.save()

    return res
    .status(200)
    .json(
        new ApiResponse(200,grevience,"Response Sent Successfully")
    )
})


const getAllAvailableDeliveryPartners = asyncHandler(async(req,res)=>{
    const order = await Order.findById(req.params.id).populate('user','userName')
    const deliveryPartners = await User.find({ role: 'employee' }).populate('userProfile', 'city').populate('orders');    

    deliveryPartners.sort((a, b) => a.orders.length - b.orders.length);

    const listOfAvailableDeliveryPartners = deliveryPartners.filter((dp)=>{
       return dp.userProfile.city === order.shippingInfo.city
    })
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,listOfAvailableDeliveryPartners,"Delivery Partners fetched successfully")
    )
})


const assignOrder = asyncHandler(async(req,res)=>{
    const orderId = req.params.orderId
    const empId = req.params.empId
    const order = await Order.findById(orderId).populate('user','userName firstName lastName')
    const emp = await User.findById(empId)
    order.orderStatus = "Shipping";

    await Notification.create({
        user:emp._id,
        message: "New Order Assigned"
    })
    emp.orders.push(order.toObject())
    await emp.save();

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 2);
    order.deliveredAt = deliveryDate;
    order.deliveredBy = emp._id;
    await order.save();

    await Notification.create({
        user:order.user._id,
        message: `Your Order has been shipped and will be delivered by ${emp.userName} 
        and will be delivered at ${order.deliveredAt}`
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,order,"Order Assigned Successfully")
    )
})


// Analysis
const getChurnedUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ role: 'user' })
        .populate('userProfile', 'age gender')
        .populate('userHistory', 'productsViewed')
        .populate('userReview');

    let userList = [];
    for (const u of users) {
        const userId = u._id;
        let age = null;
        let gender = null;
        if (u.userProfile) {
            age = u.userProfile.age;
            gender = u.userProfile.gender;
        }

        let totalMoney = 0;
        let productClicks = 0;
        let totalRating = 0;

        u.orderHistory.forEach((o) => {
            totalMoney += o.totalProductPrice;
        });
        const avgOrder = totalMoney / (u.orderHistory.length || 1);

        if (u.userHistory) {
            u.userHistory.productsViewed.forEach((p) => {
                productClicks += p.count;
            });
        }

        const apiCalled = u.__v || 0;

        u.userReview.forEach((r) => {
            totalRating += r.rating;
        });
        const avgTotalRating = totalRating / (u.userReview.length || 1);

        const userData = {
            user: userId,
            age,
            gender,
            avgOrder,
            totalMoney,
            productClicks,
            apiCalled,
            avgTotalRating
        };
        userList.push(userData);

        await WebsiteChurn.findOneAndUpdate(
            { user: userId },
            userData,
            { upsert: true, new: true }
        );
    }

    const websiteChurnData = await WebsiteChurn.find({}).populate('user', 'userProfile');

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('User List');

    worksheet.columns = [
        { header: 'UserId', key: 'userId', width: 15 },
        { header: 'Age', key: 'age', width: 10 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'AvgOrderValues', key: 'avgOrder', width: 15 },
        { header: 'TotalMoneySpent', key: 'totalMoney', width: 15 },
        { header: 'ProductClicks', key: 'productClicks', width: 15 },
        { header: 'APIsCalled', key: 'apiCalled', width: 15 },
        { header: 'AvgRatingOnAllProduct', key: 'avgTotalRating', width: 15 }
    ];

    const excelData = websiteChurnData.map(data => {
        const userData = {
            userId: data.user._id,
            age: data.age,
            gender: data.gender,
            avgOrder: data.avgOrder,
            totalMoney: data.totalMoney,
            productClicks: data.productClicks,
            apiCalled: data.apiCalled,
            avgTotalRating: data.avgTotalRating
        };
        return userData;
    });

    worksheet.addRows(excelData);

    const excelBuffer = await workbook.xlsx.writeBuffer();

    const excelFileName = 'churn_list.xlsx';
    const filePath = `${fileLocation}/${excelFileName}`;

    fs.writeFileSync(filePath, excelBuffer);

    return res
        .status(200)
        .json(
            new ApiResponse(200, excelData, "UserList added to excel Successfully")
        );
});

const deleteOldWebsiteChurnDocuments = async () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    try {
        await WebsiteChurn.deleteMany({ updatedAt: { $lt: oneMonthAgo } });
        console.log('Deleted old WebsiteChurn documents');
    } catch (error) {
        console.error('Error deleting old WebsiteChurn documents:', error);
    }
};

cron.schedule('0 0 1 * *', deleteOldWebsiteChurnDocuments);

const userLikelyToBeChurned = asyncHandler(async (req, res) => {
    try {
        const pythonScriptPath = recommendations + "/churning/websiteChurn.py";

        const pythonProcess = spawn('python', [pythonScriptPath]);
        let userWhoWillAbandon = [];

        pythonProcess.stdout.on('data', async (data) => {
            try {
                const cleanedData = data.toString().trim();
                const arrayOfStrings = cleanedData.slice(1, -1).split(" ").map(str => str.replace(/'/g, '').trim());
                for(const u of arrayOfStrings){
                    const user = await User.findById(u)
                    if(user.role==='user'){
                        userWhoWillAbandon.push(user.toObject())
                    }
                }
                return res.status(200).json(new ApiResponse(200, userWhoWillAbandon, "User Churned List fetched Successfully"));
            } catch (error) {
                console.error("Error processing churned users:", error);
                // Handle error processing data without crashing Node.js server
                return res.status(500).json({ message: 'Error processing churned users' });
            }
        });
        

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Error from Python script: ${data}`);
            // Handle error from Python script without crashing Node.js server
            return res.status(500).json({ message: 'Error from Python script' });
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                // Handle non-zero exit code without crashing Node.js server
                return res.status(500).json({ message: 'Python script exited with non-zero code' });
            } else {
                console.log('Python script exited normally');
            }
        });

        // Handle Python process error event
        pythonProcess.on('error', (error) => {
            console.error('Python process error:', error);
            // Handle Python process error without crashing Node.js server
            return res.status(500).json({ message: 'Python process error' });
        });
    } catch (error) {
        console.error('Error in userLikelyToBeChurned function:', error);
        // Handle unexpected errors without crashing Node.js server
        return res.status(500).json({ message: 'Internal server error' });
    }
});



const getNeggaUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ role: 'user' }).populate('userReview');
    const currentDate = new Date();
    const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
    // console.log(users)
    //let newReviews = [];
    for (const u of users) {
        for (const c of u.userReview) {
            const existingReview = await ReviewSentiment.findOne({
                review: c._id.toString()
            });
            // console.log(existingReview)

            // if (!existingReview) {
            //     newReviews.push({
            //         user: c.user,
            //         product: c.product,
            //         rating: c.rating,
            //         comment: c.comment
            //     });
            // }

            if(!existingReview){
                await ReviewSentiment.create({
                    user: c.user,
                    product: c.product,
                    review:c.review,
                    rating: c.rating,
                    comment: c.comment
                })
            }
        }
    }
    //console.log(newReviews.length)

    // try {
    //     if (newReviews.length > 0) {
    //         await ReviewSentiment.insertMany(newReviews);
    //     }
    // } catch (error) {
    //     console.error('Error storing new reviews:', error);
    //     return res.status(500).json({ error: 'Internal Server Error' });
    // }

    try {
        await ReviewSentiment.deleteMany({ createdAt: { $lt: oneMonthAgo } });
    } catch (error) {
        console.error('Error deleting old reviews:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    let reviews;
    try {
        reviews = await ReviewSentiment.find({});
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Reviews');

    worksheet.columns = [
        { header: 'User', key: 'user', width: 20 },
        { header: 'Product', key: 'product', width: 20 },
        { header: 'Rating', key: 'rating', width: 10 },
        { header: 'Comment', key: 'comment', width: 40 }
    ];

    reviews.forEach((review) => {
        worksheet.addRow({
            user: review.user.toString(),
            product: review.product.toString(),
            rating: review.rating,
            comment: review.comment
        });
    });

    const filePath = fileLocation + '/sentiments.xlsx';
    try {
        await workbook.xlsx.writeFile(filePath);
    } catch (error) {
        console.error('Error writing Excel file:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    return res.status(200).json(new ApiResponse(200,reviews,"Reviews stored successfully"));
});

const userNegativeReviews = asyncHandler(async(req, res) => {
    try {
        const pythonScript = spawn('python', [`${recommendations}/sentiment/sentiment.py`]);
        let usersToBeNegative = [];

        pythonScript.stdout.on('data', async (data) => {
            try {
                const cleanedData = data.toString().trim();
                const trimmedData = cleanedData.slice(1, -1);
                const negativeUserIds = trimmedData.split(',').map(id => id.trim().replace(/'/g, ''));
                // console.log(negativeUserIds)
                for (const id of negativeUserIds) {
                    if (id) {
                        const user = await User.findById(id);
                        if (user && user.role==='user') {
                            usersToBeNegative.push({
                                _id: user._id,
                                user : user.userName,
                                firstName: user.firstName,
                                lastName: user.lastName,
                            });
                        }
                    }
                }
                return res.status(200).json(new ApiResponse(200, usersToBeNegative, "User Sentiment List fetched Successfully"));
            } catch (error) {
                console.error('Error retrieving user reviews:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        pythonScript.stderr.on('data', (data) => {
            console.error(`Error from Python script: ${data}`);
            return res.status(500).json({ error: 'Internal Server Error' });
        });

        pythonScript.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                return res.status(500).json({ error: 'Python script exited with non-zero code' });
            } else {
                console.log('Python script exited normally');
            }
        });

        // Handle Python process error event
        pythonScript.on('error', (error) => {
            console.error('Python process error:', error);
            return res.status(500).json({ error: 'Python process error' });
        });
    } catch (error) {
        console.error('Error in userNegativeReviews function:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


const findSimilarUsers = asyncHandler(async (req, res) => {
    const targetUserHistory = await UserHistory.findOne({ user: req.params.id });
    const targetProducts = targetUserHistory.productsPurchased.map(item => item.product.name.toString());
    const allUsersHistory = await UserHistory.find({ user: { $ne: req.params.id } }).populate('user','userName firstName lastName');

    const similarUsers = [];
    for (const userHistory of allUsersHistory) {
        const intersectionProducts = userHistory.productsPurchased.filter(p => !targetProducts.includes(p.product.name.toString()));
        const otherUserProducts = userHistory.productsPurchased.map(item => item.product.name.toString());
        const intersection = targetProducts.filter(product => otherUserProducts.includes(product));
        const union = [...new Set([...targetProducts, ...otherUserProducts])];
        const similarity = intersection.length / union.length;

        if(similarity !== 0){
            similarUsers.push({
                user: userHistory.user._id,
                userName : userHistory.user.userName,
                firstName: userHistory.user.firstName,
                lastName : userHistory.user.lastName,
                similarity,
                intersectionProducts
            });
        }
    }

    similarUsers.sort((a, b) => b.similarity - a.similarity);

    return res
    .status(200)
    .json(
        new ApiResponse(200,similarUsers,"Similar User fetched successfully")
    )
});



const sendNotificationsToUser = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.params.id);
    const {message} = req.body;
    const notification = await Notification.create({
        user:user._id,
        message:message
    })
    return res
    .status(200)
    .json(
        new ApiResponse(200,notification,"Notification Sent Successfully")
    )
})


const getAbandonUsers = asyncHandler(async(req,res)=>{
    const users = await CartAbandon.find();

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Cart Abandon Users');

    worksheet.columns = [
        { header: 'ID', key: 'user', width: 15 },
        { header: 'No_Items_Added_InCart', key: 'itemsAddedToCart', width: 20 },
        { header: 'No_Items_Removed_FromCart', key: 'itemsRemovedFromCart', width: 25 },
        { header: 'No_Cart_Viewed', key: 'timescartViewed', width: 20 },
        { header: 'No_Checkout_Confirmed', key: 'timesCheckoutConfirmed', width: 30 },
        { header: 'No_Checkout_Initiated ', key: 'timesCheckoutInitiated', width: 30 },
        { header: 'No_Customer_Login', key: 'timesLogIn', width: 20 },
        { header: 'No_Page_Viewed', key: 'timesPageViewed', width: 25 },
    ];

    users.forEach(user => {
        worksheet.addRow({
            user: user.user,
            itemsAddedToCart: user.itemsAddedToCart,
            itemsRemovedFromCart: user.itemsRemovedFromCart,
            timescartViewed: user.timescartViewed,
            timesCheckoutConfirmed: user.timesCheckoutConfirmed,
            timesCheckoutInitiated: user.timesCheckoutInitiated,
            timesLogIn: user.timesLogIn,
            timesPageViewed: user.timesPageViewed,
        });
    });

    const filePath = fileLocation + '/abandon.xlsx';
    try {
        await workbook.xlsx.writeFile(filePath);
    } catch (error) {
        console.error('Error writing Excel file:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,users,"Users added successfully")
    )
})


const findAbandonUsers = asyncHandler(async(req,res)=>{
    try {
        const pythonScriptPath = recommendations + "/abandon/cartabandon.py";

        const pythonProcess = spawn('python', [pythonScriptPath]);
        let userWhoWillAbandon = [];

        pythonProcess.stdout.on('data', async (data) => {
            try {
                const cleanedData = data.toString().trim();
                const arrayOfStrings = cleanedData.slice(1, -1).split(" ").map(str => str.replace(/'/g, '').replace(/,/g, '').trim());
                for(const u of arrayOfStrings){
                    const user = await User.findById(u);
                    if(user.role === 'user'){
                        userWhoWillAbandon.push(user.toObject());
                    }
                }
                return res.status(200).json(new ApiResponse(200, userWhoWillAbandon, "User Abandon List fetched Successfully"));
            } catch (error) {
                console.error("Error processing churned users:", error);
                // Handle error processing data without crashing Node.js server
                return res.status(500).json({ message: 'Error processing churned users' });
            }
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Error from Python script: ${data}`);
            // Handle error from Python script without crashing Node.js server
            return res.status(500).json({ message: 'Error from Python script' });
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                // Handle non-zero exit code without crashing Node.js server
                return res.status(500).json({ message: 'Python script exited with non-zero code' });
            } else {
                console.log('Python script exited normally');
            }
        });

        // Handle Python process error event
        pythonProcess.on('error', (error) => {
            console.error('Python process error:', error);
            // Handle Python process error without crashing Node.js server
            return res.status(500).json({ message: 'Python process error' });
        });
    } catch (error) {
        console.error('Error in userLikelyToBeChurned function:', error);
        // Handle unexpected errors without crashing Node.js server
        return res.status(500).json({ message: 'Internal server error' });
    }
})


const groupNotifications = asyncHandler(async(req,res)=>{
    const {listOfUsers , message} = req.body;
    for(const u of listOfUsers){
        await Notification.create({
            user:u.toString(),
            message:message
        })
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Notification created successfully")
    )
})


const recommendProductsBySimilarity = asyncHandler(async(req,res)=>{
    const {userId,productId} = req.params;
    const product = await Product.findById(productId)
    const updatedHistory = await UserHistory.findOneAndUpdate(
        { user: userId },
        { $push: { recommendedByAdmin: product } },
        { new: true, upsert: true }
    );
    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedHistory,"Product recommended successfully")
    )
})


const customRecommendations = asyncHandler(async(req,res)=>{
    const user = await UserHistory.findOne({user:req.params.id}).populate({
        path: 'user',
        select: 'userName firstName lastName',
        populate: {
            path: 'userProfile',
            select: 'height weight gender bpLevel diabetesLevel cholesterolLevel'
        }
    });
    const bmi = user.user.userProfile.height/user.user.userProfile.weight
    const bmiCat = (bmi <= 18.5)?"Underweight":((bmi >= 25 && bmi <= 29.9))?"Normal":"Overweight"

    const user_details = {
        "BMI": bmiCat,
        "Gender": user.user.userProfile.gender.charAt(0).toUpperCase() + user.user.userProfile.gender.slice(1),
        "Blood_Pressure": user.user.userProfile.bpLevel,
        "Diabetes": user.user.userProfile.diabetesLevel,
        "Cholesterol_Level": user.user.userProfile.cholesterolLevel
    };

    const products = {
        bulk: [
          "Whey Protein Powder",
          "Creatine Monohydrate",
          "Mass Gainer Supplement",
          "BCAA (Branched-Chain Amino Acids)",
          "Pre-Workout Supplement",
          "Protein Shake Ready-to-Drink (RTD)",
          "Thermogenic Fat Burner",
          "Carb Powder",
          "Nitric Oxide Booster",
          "Muscle Recovery Cream",
          "Post-Workout Protein Shake Mix",
          "Protein-rich Energy Bites",
          "Testosterone Boosting Supplements"
        ],
        cut: [
          "Protein Coffee",
          "CLA (Conjugated Linoleic Acid) Supplement",
          "Electrolyte Drink Mix",
          "Thermogenic Fat Burner",
          "Muscle Recovery Cream",
          "Omega-3 Fish Oil Supplements",
          "Branched-Chain Amino Acid Capsules",
          "Greens Superfood Powder",
          "Antioxidant-Rich Superfood Supplements"
        ],
        lean: [
          "Peanut Butter Protein Powder",
          "Vegan Protein Powder",
          "Casein Protein Powder",
          "Post-Workout Recovery Drink",
          "Glutamine Supplement",
          "Fish Oil Capsules",
          "Multivitamin for Athletes",
          "Joint Support Supplement",
          "Protein Cookies",
          "Protein Pancake Mix",
          "Protein Brownie Mix",
          "Protein Ice Cream Mix",
          "Protein Water",
          "Protein Pasta",
          "Protein Chips",
          "Protein Popcorn",
          "Electrolyte Drink Mix",
          "Muscle Recovery Supplements",
          "Post-Workout Protein Shake Mix",
          "Electrolyte Drink Tablets",
          "Collagen Peptides Powder",
          "Meal Replacement Shakes",
          "Plant-Based Meal Prep Services",
          "Hydration Pack for Running",
          "Energy Gel Packs for Endurance",
          "Electrolyte Powders for Hydration",
          "Hydration Mix with Probiotics",
          "Plant-Based Protein Bars",
          "Vegan Protein Bars"
        ]
    };

    try {
        const pythonScriptPath = recommendations + "/custom/custom.py";

        const pythonProcess = spawn('python', [pythonScriptPath, JSON.stringify(user_details)]);

        pythonProcess.stdout.on('data', async (data) => {
            try {
                const goal = data.toString().trim().toLowerCase();
                const productsWithGoal = products[goal].sort(() => Math.random() - 0.5).slice(0, 2);
                //let listOfProductsAsPerTheGoal = [];
                for(const p of productsWithGoal){
                    const product = await Product.findOne({name:p})
                    user.recommendedByAdmin.push(product.toObject())
                }
                await user.save();
                return res
                .status(200)
                .json(
                    new ApiResponse(200, productsWithGoal, "Products as per goal recommended succeesfully")
                );
            } catch (error) {
                console.error("Error processing churned users:", error);
                // Handle error processing data without crashing Node.js server
                return res.status(500).json({ message: 'Error processing churned users' });
            }
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Error from Python script: ${data}`);
            // Handle error from Python script without crashing Node.js server
            return res.status(500).json({ message: 'Error from Python script' });
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                // Handle non-zero exit code without crashing Node.js server
                return res.status(500).json({ message: 'Python script exited with non-zero code' });
            } else {
                console.log('Python script exited normally');
            }
        });

        // Handle Python process error event
        pythonProcess.on('error', (error) => {
            console.error('Python process error:', error);
            // Handle Python process error without crashing Node.js server
            return res.status(500).json({ message: 'Python process error' });
        });
    } catch (error) {
        console.error('Error in userLikelyToBeChurned function:', error);
        // Handle unexpected errors without crashing Node.js server
        return res.status(500).json({ message: 'Internal server error' });
    }
})


const getAdminDashboard = asyncHandler(async(req,res)=>{
    const user = await User.find({role:'user'});
    let revenue = 0;
    user.map((u)=>{
        for(const o of u.orderHistory){
            revenue += o.subtotalPrice
        }
    })
    const dashDeatils = {
        userRegistered:user.length,
        totalRevenue : revenue.toFixed(2)
    }
    return res.status(200).json(new ApiResponse(200,dashDeatils,"Dashboard details fetched sucesfully"))
})

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
    getShippingOrders,
    getApprovedOrders,
    getDeliveredOrders,
    completeOrder,
    viewGreviences,
    viewUserGrevience,
    responseForEmployement,
    getAllAvailableDeliveryPartners,
    assignOrder,
    getChurnedUsers,
    userLikelyToBeChurned,
    getNeggaUsers,
    userNegativeReviews,
    findSimilarUsers,
    sendNotificationsToUser,
    getAbandonUsers,
    findAbandonUsers,
    groupNotifications,
    recommendProductsBySimilarity,
    customRecommendations,
    getAdminDashboard
}