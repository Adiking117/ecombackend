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

        const pythonProcess = spawn('python', [`${recommendations}/clustering/ageHeightWeight.py`, age, height, weight]);
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

        const pythonProcess = spawn('python', [`${recommendations}/clustering/goalGender.py`, goal, gender]);

        pythonProcess.stdout.on('data', (data) => {
            recommendedProducts = JSON.parse(data.toString().trim());
            console.log(recommendedProducts)
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



const getRecommendedProductsByFrequentlyBuying = asyncHandler(async(req, res) => {
    try {
        const orders = await Order.find();
        let transactions = [];

        for (const o of orders) {
            let t = new Set();
            o.orderItems.forEach((item) => {
                t.add(item.name);
            });
            transactions.push(Array.from(t)); 
        }
        //console.log(JSON.stringify(transactions))
        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ error: 'Product not found' });
        }

        const pythonProcess = spawn('python', [
            recommendations+'/apriori.py', 
            product.name, 
            JSON.stringify(transactions)
            //transactions
        ]);

        let productsArray = [];

        pythonProcess.stdout.on('data', (data) => {
            const productsString = data.toString().trim();
            const receivedProducts = JSON.parse(productsString);
            productsArray.push(...receivedProducts);
            //console.log(productsArray)
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });

        pythonProcess.on('close', async (code) => {
            if (code === 0) {
                if (productsArray.length > 0) {
                    let prodDetails = [];
                    for (const p of productsArray) {
                        const product = await Product.findOne({ name: p });
                        prodDetails.push(product.toObject());
                    }
                    res.status(200).json(new ApiResponse(200, prodDetails, "Frequently bought Products fetched"));
                } else {
                    res.status(200).json(new ApiResponse(200, [], "No frequently bought Products found"));
                }
            } else {
                res.status(500).json({ error: 'An error occurred while running the Python script' });
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});


const getRecommendedProductsByFrequentlyBuyingStorePage = asyncHandler(async(req,res)=>{
    const orderHistory = req.user.orderHistory;
    const lastOrder = orderHistory[orderHistory.length - 1];
    const lastOrderItem = lastOrder?.orderItems[lastOrder.orderItems.length - 1];

    const pythonProcess = spawn('python', [`${recommendations}/apriori.py`, lastOrderItem?.name]);

    let productsArray = [];

        pythonProcess.stdout.on('data', (data) => {
            const productsString = data.toString().trim();
            const receivedProducts = JSON.parse(productsString);
            productsArray.push(...receivedProducts);
            //console.log(productsArray)
        });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data}`);
        res.status(500).json({ error: 'An error occurred while running the Python script' });
    });

    pythonProcess.on('close', async(code) => {
        if (code === 0) {
            try {
                let prodDetails = []
                for(const p of productsArray){
                    const product = await Product.findOne({name:p})
                    prodDetails.push(product.toObject())
                }
                res.status(200).json(new ApiResponse(200,prodDetails,"Frequently buyed Products fetched"));
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'An error occurred while processing the data' });
            }
        } else {
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        }
    });
})


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

        const userHistory = await UserHistory.findOne({user:user._id})

        userHistory.productsPurchased.forEach((p) => {
            if (new Date(p.addedAt) >= last7Days) {
                recommendedProducts.last7Days.push(p.product);
            }
            if (new Date(p.addedAt) >= last2Weeks) {
                recommendedProducts.last2Weeks.push(p.product);
            }
            if (new Date(p.addedAt) >= lastMonth) {
                recommendedProducts.lastMonth.push(p.product);
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
    getRecommendedProductsByFrequentlyBuying,
    getRecommendedProductsByFrequentlyBuyingStorePage,
    getRecommendedExercisesByExerciseUserGoals,
    getRecommendedProductsByProductUserGoals,
    getRecommendedProductsByTop5PurchasedProducts,
    getRecommendedProductsByRecentlyPurchasedProducts,
    getRecommendedProductsByRecentlySearchedProducts,
    getRecommendedProductsByRecentlyViewedProducts,
    getRecommendedProductsByTimeLine
}