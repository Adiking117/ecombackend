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
import { OrderTransaction } from "../models/orderTransaction.models.js"

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
        const transactions = await OrderTransaction.findOne()
        let transactionList = [];
        for(const t of transactions.transactionList){
            transactionList.push(t.products)
        }

        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ error: 'Product not found' });
        }

        const pythonProcess = spawn('python', [
            recommendations+'/apriori.py', 
            product.name, 
            JSON.stringify(transactionList)
        ]);

        let productsArray = [];

        pythonProcess.stdout.on('data', (data) => {
            const productsString = data.toString().trim();
            const receivedProducts = JSON.parse(productsString);
            console.log(receivedProducts)
            productsArray.push(...receivedProducts);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            // Don't immediately send response, just log the error
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
                console.error(`Python process exited with code ${code}`);
                res.status(500).json({ error: 'An error occurred while running the Python script' });
            }
        });

        // Add an error event handler for the Python process
        pythonProcess.on('error', (err) => {
            console.error('Python process error:', err);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});


const getRecommendedProductsByFrequentlyBuyingStorePage = asyncHandler(async(req, res) => {
    try {
        const transactions = await OrderTransaction.findOne()
        let transactionList = [];
        for(const t of transactions.transactionList){
            transactionList.push(t.products)
        }

        const orderHistory = req.user.orderHistory;
        const lastOrder = orderHistory[orderHistory.length - 1];
        const lastOrderItem = lastOrder?.orderItems[lastOrder.orderItems.length - 1];

        const pythonProcess = spawn('python', [
            `${recommendations}/apriori.py`, 
            lastOrderItem?.name,
            JSON.stringify(transactionList)
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
            // Don't immediately send response, just log the error
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
                console.error(`Python process exited with code ${code}`);
                res.status(500).json({ error: 'An error occurred while running the Python script' });
            }
        });

        // Add an error event handler for the Python process
        pythonProcess.on('error', (err) => {
            console.error('Python process error:', err);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
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

        let products = [];

        pythonProcess.stdout.on('data', async(data) => {
            const productsArray = data.toString().trim().split(',');
            const productPromises = productsArray.map(async p => {
                const product = await Product.findOne({ name: p });
                return product;
            });
            products = await Promise.all(productPromises);
            return res.status(200).json(
                new ApiResponse(200, products, "Top 5 products fetched successfully")
            );
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python stderr: ${data}`);
            res.status(500).json({ error: 'An error occurred while running the Python script' });
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
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
    let recentViewedProducts = [];
    for(const u of userHistory.productsViewed){
        if(u.count>=3){
            const product = await Product.findById(u.product.toString())
            recentViewedProducts.push(product.toObject())
        }
    }

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
        const recommendedProducts = {
            last7Days: [],
            last2Weeks: [],
            lastMonth: []
        };

        const userHistory = await UserHistory.findOne({ user: userId });

        userHistory.productsPurchased.forEach((p) => {
            const addedDate = new Date(p.addedAt);

            if (addedDate >= last7Days) {
                recommendedProducts.last7Days.push(p.product);
            }
            if (addedDate >= last2Weeks) {
                recommendedProducts.last2Weeks.push(p.product);
            }
            if (addedDate >= lastMonth) {
                recommendedProducts.lastMonth.push(p.product);
            }
        });

        // Slice arrays to contain at most two elements
        recommendedProducts.last7Days = recommendedProducts.last7Days.slice(0, 2);
        recommendedProducts.last2Weeks = recommendedProducts.last2Weeks.slice(0, 2);
        recommendedProducts.lastMonth = recommendedProducts.lastMonth.slice(0, 2);

        return res
            .status(200)
            .json(
                new ApiResponse(200, recommendedProducts, "Products recommended")
            );
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


const getRecommendedProductsByAdmin = asyncHandler(async(req,res)=>{
    const user = await UserHistory.findOne({user:req.user._id})
    return res
    .status(200)
    .json(
        new ApiResponse(200,user.recommendedByAdmin.slice(-6),"Admin Recommednation successfully")
    )
})



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
    getRecommendedProductsByTimeLine,
    getRecommendedProductsByAdmin
}