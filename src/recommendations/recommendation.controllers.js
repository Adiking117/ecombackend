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
import { Exercise } from "../models/exercise.models.js"
import { UserHistory } from "../models/userHistory.models.js"


const getRecommendedProductsByAgeHeightWeight = asyncHandler(async (req, res) => {
    try {
        const userProfile = await Profile.findOne( { user: req.user._id } )
        const { age,height,weight } = userProfile
        let recommendedProducts = [];

        const pythonProcess = spawn('python', [`${recommendations}/ageHeightWeight.py`, age, height, weight]);
        pythonProcess.stdout.on('data', (data) => {
            const productsArray = JSON.parse(data.toString().trim());
            recommendedProducts = productsArray;
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });

        pythonProcess.on('close', async(code) => {
            let productsToBeRecommended = [];
            for(const pname of recommendedProducts){
                const product = await Product.findOne({name:pname})
                productsToBeRecommended.push(product)
            }
            res.status(200).json(
                new ApiResponse(200,productsToBeRecommended,"Product recommeded successfully")
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

        let recommendedProducts = [];

        const pythonProcess = spawn('python', [`${recommendations}/goalGender.py`, goal, gender]);

        pythonProcess.stdout.on('data', (data) => {
            recommendedProducts = JSON.parse(data.toString().trim());
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });

        pythonProcess.on('close', async(code) => {
            let productsToBeRecommended = [];
            for (const pname of recommendedProducts) {
                const product = await Product.findOne({ name: pname })
                productsToBeRecommended.push(product)
            }
            return res.status(200).json(
                new ApiResponse(200, productsToBeRecommended, "Product recommended successfully")
            );
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});


const getRecommendedProductsByCityCountry = asyncHandler(async (req, res) => {
    try {
        const userProfile = await Profile.findOne({ user: req.user._id });
        const { city, country } = userProfile;

        let recommendedProducts = [];

        const pythonProcess = spawn('python', [`${recommendations}/cityCountry.py`, city, country]);

        pythonProcess.stdout.on('data', (data) => {
            recommendedProducts = JSON.parse(data.toString().trim());
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });

        pythonProcess.on('close', async (code) => {
            let productsToBeRecommended = [];
            for (const pname of recommendedProducts) {
                const product = await Product.findOne({ name: pname })
                productsToBeRecommended.push(product)
            }
            res.status(200).json(
                new ApiResponse(200, productsToBeRecommended, "Product recommended successfully")
            );
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});



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


const getRecommendedExercisesByExerciseUserGoals = asyncHandler(async(req,res)=>{
    const userProfile = await Profile.findById(req.user.userProfile)
    const recommendedExercises = await Exercise.find({ exerciseGoal: { $in: [userProfile.goal] } });
    // const exercises = await Exercise.find()
    // const recommendedExercises = exercises.filter(exercise =>
    //     exercise.exerciseGoal.includes(userProfile.goal)
    // );
    if(recommendedExercises.length === 0){
        throw new ApiError(400,"Fill your Profile")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,recommendedExercises,"Exercises as per your Goals recommended")
    )
})


const getRecommendedProductsByProductUserGoals = asyncHandler(async(req,res)=>{
    const userProfile = await Profile.findById(req.user.userProfile);
    const recommendedProducts = await Product.find({ productGoal: { $eq: userProfile.goal } }).limit(6);
    return res
    .status(200)
    .json(
        new ApiResponse(200,recommendedProducts,"Products as per your Goals recommended")
    )
})


const getRecommendedProductsByTop5PurchasedProducts = asyncHandler(async (req, res) => {
    try {
        const pythonProcess = spawn('python', [`${recommendations}/top5PurchasedProducts.py`]);

        let top5ProductsOfAllTime = [];

        pythonProcess.stdout.on('data', async(data) => {
            const productsArray = data.toString().trim().split(',');
            for(let p of productsArray){
                const product = await Product.findOne({name : p.trim()})
                top5ProductsOfAllTime.push(product)
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                res.status(200).json(
                    new ApiResponse(200,top5ProductsOfAllTime,"Top 5 products Fetched successfully")
                );
            } else {
                res.status(500).json({ error: 'An error occurred while running the Python script' });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});


const getRecommendedProductsByRecentlyPurchasedProducts = asyncHandler(async(req,res)=>{
    const user = req.user
    const userHistory = await UserHistory.findOne({user:user._id})  
    const recentlyPurchased = userHistory.productsPurchased.slice(-6);
  
    return res
    .status(200)
    .json(
        new ApiResponse(200,recentlyPurchased,"Recently you purchased")
    )
})


const getRecommendedProductsByRecentlyViewedProducts = asyncHandler(async(req,res)=>{
    const user = req.user
    const userHistory = await UserHistory.findOne({user:user._id})
    const recentViewedProducts = userHistory.productsViewed.filter((p)=>{
        return p.count >= 3
    })
    const recentlyViewed = recentViewedProducts.slice(-6);

    return res
    .status(200)
    .json(
        new ApiResponse(200,recentlyViewed,"Recently you Viewed")
    )
})


const getRecommendedProductsByRecentlySearchedProducts = asyncHandler(async(req,res)=>{
    const user = req.user
    const userHistory = await UserHistory.findOne({user:user._id})
    const recentlySearched = userHistory.productsPurchased.slice(-6);

    return res
    .status(200)
    .json(
        new ApiResponse(200,recentlySearched,"Recently you Searched")
    )
})


const getRecommendedProductsByTimeLine = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const currentDate = new Date();
    const last7Days = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last2Weeks = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());

    try {
        const user = await User.findById(userId)
        const recommendedProducts = {
            last7Days: [],
            last2Weeks: [],
            lastMonth: []
        };

        user.orderHistory.forEach(order => {
            if (order.createdAt >= last7Days) {
                order.orderItems.forEach(item => {
                    const existingIndex = recommendedProducts.last7Days.findIndex(existingItem => existingItem.product.toString() === item.product.toString());
                    if (existingIndex !== -1) {
                        recommendedProducts.last7Days.splice(existingIndex, 1);
                        recommendedProducts.last7Days.push(item);
                    } else {
                        recommendedProducts.last7Days.push(item);
                    }
                });
            }
            if (order.createdAt >= last2Weeks) {
                order.orderItems.forEach(item => {
                    const existingIndex = recommendedProducts.last7Days.findIndex(existingItem => existingItem.product.toString() === item.product.toString());
                    if (existingIndex !== -1) {
                        recommendedProducts.last7Days.splice(existingIndex, 1);
                        recommendedProducts.last7Days.push(item);
                    } else {
                        recommendedProducts.last7Days.push(item);
                    }
                });
            }
            if (order.createdAt >= lastMonth) {
                order.orderItems.forEach(item => {
                    const existingIndex = recommendedProducts.last7Days.findIndex(existingItem => existingItem.product.toString() === item.product.toString());
                    if (existingIndex !== -1) {
                        recommendedProducts.last7Days.splice(existingIndex, 1);
                        recommendedProducts.last7Days.push(item);
                    } else {
                        recommendedProducts.last7Days.push(item);
                    }
                });
            }
        });

        return res
        .status(200)
        .json(
            new ApiResponse(200,recommendedProducts,"Products recommended")
        );
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});




export {
    getRecommendedProductsByAgeHeightWeight,
    getRecommendedProductsByGoalGender,
    getRecommendedProductsByCityCountry,
    getRecommendedProductsByFrequentlyBuying,
    getRecommendedExercisesByExerciseUserGoals,
    getRecommendedProductsByProductUserGoals,
    getRecommendedProductsByTop5PurchasedProducts,
    getRecommendedProductsByRecentlyPurchasedProducts,
    getRecommendedProductsByRecentlySearchedProducts,
    getRecommendedProductsByRecentlyViewedProducts,
    getRecommendedProductsByTimeLine
}