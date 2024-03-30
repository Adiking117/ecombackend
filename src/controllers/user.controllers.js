import { User } from "../models/user.models.js"
import { Profile } from "../models/profile.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const generateUserAccessRefreshToken = async function(user_id){
    try {
        const user = await User.findById(user_id);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({validation:false})
        return { accessToken,refreshToken }
    } catch (error) {
        throw new ApiError(500,error)
    }
}


const registerUser = asyncHandler(async(req,res)=>{
    const {userName , email , firstName , lastName , password } = req.body;
    console.log("register triggered",req.body)

    if (!userName || !email || !firstName || !lastName || !password) {
        throw new ApiError(401, "Fill all the details");
    }
    
    const existedUser = await User.findOne({userName})
    if(existedUser){
        throw new ApiError(401,"User Already exists")
    }

    const user = await User.create({
        userName,
        email,
        firstName,
        lastName,
        password,
        isLoggedIn:false,
        role:'user'
    })

    if(email === 'www.adivc2003@gmail.com'){
        user.role = 'admin'
    }

    await user.save();

    console.log("user  ",user)

    const newuser = await User.findById(user._id).select("-password")
    // console.log(newuser)

    if(!newuser){
        throw new ApiError(500,"Something went Wrong")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,newuser,"User Registered Successfully")
    )
})


const loginUser = asyncHandler(async(req,res)=>{
    const { userName , password } = req.body

    console.log("Login triggered" , req.body)

    const user = await User.findOne({userName})
    if(!user){
        throw new ApiError(401 , "User doesnt exists , Register first")
    }

    const isPasswordCorrect = await user.isPasswordValid(password)
    if(!isPasswordCorrect){
        throw new ApiError(401 , "Password Doesnt match")
    }

    const { accessToken,refreshToken } = await generateUserAccessRefreshToken(user._id)

    await User.findOneAndUpdate(
        {userName},
        {
            $set:{
                isLoggedIn:true
            }
        },
        {
            new:true
        }
    )

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {       
        httpOnly:true,
        // secure:true,
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                loggedInUser:loggedInUser,accessToken,refreshToken
            }
            ,"User Logged In Successfully"
        )
    )
})


const updateUserProfile = asyncHandler(async(req,res)=>{
    try {
        console.log("req user updateuserprofile",req.user)
        console.log("req body updateuserprofile",req.body)

        const userName = req.user.userName;
        const { age, weight, height, goal, gender, country, city } = req.body;
    
        if (!age || !weight || !height || !goal || !gender || !country || !city) {
          throw new ApiError(400, "All fields are required");
        }
        
        let profile = await Profile.findOne({ user: userName });
        
        if (!profile) {
          profile = new Profile({user: userName,age,weight,height,goal,gender,country,city,});
        } else {
          profile.age = age;
          profile.weight = weight;
          profile.height = height;
          profile.goal = goal;
          profile.gender = gender;
          profile.country = country;
          profile.city = city;
        }
    
        await profile.save();
        const options = {       
            httpOnly:true,
            secure:true
        }
    
        return res.status(200)
        // .cookie("accessToken",accessToken,options)
        // .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200, profile, "Profile updated successfully"));

      } catch (error) {
        console.error("Error updating profile:", error);
        throw new ApiError(500,"Profile not updated")
      }
})


const getDetails = asyncHandler(async(req,res)=>{
    
    console.log("get details triggred")
    const user = await User.findOne({ userName:req.user.userName })
    if(!user){
        throw new ApiError(400,"USer not found")
    }
    if(user.isLoggedIn===false){
        throw new ApiError(400,"You are not logged in")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,user," ")
    )
})


const logoutUser = asyncHandler(async(req,res)=>{
    console.log("logout controller", req.user)
    const {userName} = req.user.userName;
    // const userName = req.user.userName;
    // await User.findOneAndUpdate(
    //     {userName},
    //     {
    //         $set:{
    //             refreshToken: undefined
    //         }
    //     },
    //     {
    //         new:true
    //     }
    // )
    await User.findOneAndUpdate(
        {userName},
        {
            $set:{
                isLoggedIn:false
            }
        }
    )

    const options = {
        httpOnly:true,
        secure:true,
        expires: new Date(Date.now())
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,`User logged out`)
    )
})

// const logoutUser = asyncHandler(async(req,res)=>{
//     res.cookie('refreshToken',null,{
//         expires:new Date(Date.now()),
//         httpOnly:true,
//     })
//     res.status(200).json(new ApiResponse(200,"USer Logged out"))
// })


// get all products , view a product , add product to cart

// review a product , rate a product

// view cart , update cart , delete cart , buy products , order creation

// get order history , get a order 


export {
    registerUser,
    loginUser,
    updateUserProfile,
    getDetails,
    logoutUser
}