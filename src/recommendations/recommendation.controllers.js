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

        pythonProcess.on('close', async(code) => {
            const productToBeRecommended = await Product.findOne( { name:recommendedProduct })
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

        pythonProcess.on('close', async(code) => {
            const productToBeRecommended = await Product.findOne( { name:recommendedProduct })
            res.status(200).json(
                new ApiResponse(200, productToBeRecommended, "Product recommended successfully")
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

        pythonProcess.on('close', async(code) => {
            const productToBeRecommended = await Product.findOne( { name:recommendedProduct })

            res.status(200).json(
                new ApiResponse(200, productToBeRecommended, "Product recommended successfully")
            );
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
})


const getRecommendedProductsByFrequentlyBuying = asyncHandler(async(req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if(!product){
            throw new ApiError(400,"Products not found")
        }

        const pythonProcess = spawn('python', [`${recommendations}/frequentlyBuy.py`, product.name]);

        let productList = []

        let recommendedProductsString = '';
        let recommendedProducts = []

        pythonProcess.stdout.on('data', (data) => {
            recommendedProductsString += data.toString().trim();
            const productsArray = recommendedProductsString.split(/' '|\['|\]|\[/)
            recommendedProducts = productsArray.map(product => product.trim().replace(/'$/, '')).filter(Boolean);
            console.log(recommendedProducts);
        });


        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });

        pythonProcess.on('close', async(code) => {
            for (const item of recommendedProducts) {
                const product = await Product.findOne({ name: item });
                productList.push(product);
            }
            if (code === 0) {
                res.status(200).json({ productList });
            } else {
                res.status(500).json({ error: 'An error occurred while running the Python script' });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});



export {
    getRecommendedProductsByAgeHeightWeight,
    getRecommendedProductsByGoalGender,
    getRecommendedProductsByCityCountry,
    getRecommendedProductsByFrequentlyBuying
}