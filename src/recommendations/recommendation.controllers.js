import { User } from "../models/user.models.js"
import { Profile } from "../models/profile.models.js"
import { Shipping } from "../models/shipping.models.js"
import { Gallery } from "../models/gallery.models.js"
import { Product } from "../models/products.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Order } from "../models/orders.models.js"
import { UserDetails } from "../models/userDetails.models.js"
import { Notification } from "../models/notifications.models.js"
import { fileLocation,recommendations } from "../filelocation.js"
import { spawn } from 'child_process';

const getRecommendedProductsByAgeHeightWeight = asyncHandler(async (req, res) => {
    try {
        const userProfile = await Profile.findOne( { user: req.user._id } )
        const { age,height,weight } = userProfile
        let recommendedProduct = '';

        const pythonProcess = spawn('python', [`${recommendations}/ageHeightWeight.py`, age, height, weight]);
        pythonProcess.stdout.on('data', (data) => {
            recommendedProduct += data.toString().trim();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });

        const productToBeRecommended = await Product.findOne( { name:recommendedProduct })
        console.log(productToBeRecommended)

        pythonProcess.on('close', (code) => {
            res.status(200).json(
                new ApiResponse(200,productToBeRecommended,"Product recommeded successfully")
            );
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});


const getRecommendedProductsByGoalGender = asyncHandler(async (req, res) => {
    try {
        const userProfile = await Profile.findOne({ user: req.user._id });
        const { goal, gender } = userProfile;

        let recommendedProduct = '';

        const pythonProcess = spawn('python', [`${recommendations}/goalGender.py`, goal, gender]);

        pythonProcess.stdout.on('data', (data) => {
            recommendedProduct += data.toString().trim();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });

        pythonProcess.on('close', (code) => {
            res.status(200).json(
                new ApiResponse(200, recommendedProduct, "Product recommended successfully")
            );
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});


const getRecommendedProductsByCityCountry = asyncHandler(async(req,res)=>{
    try {
        const userProfile = await Profile.findOne({ user: req.user._id });
        const { city, country } = userProfile;

        let recommendedProduct = '';

        const pythonProcess = spawn('python', [`${recommendations}/cityCountry.py`, city, country]);

        pythonProcess.stdout.on('data', (data) => {
            recommendedProduct += data.toString().trim();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });

        pythonProcess.on('close', (code) => {
            res.status(200).json(
                new ApiResponse(200, recommendedProduct, "Product recommended successfully")
            );
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
})


export {
    getRecommendedProductsByAgeHeightWeight,
    getRecommendedProductsByGoalGender,
    getRecommendedProductsByCityCountry
}