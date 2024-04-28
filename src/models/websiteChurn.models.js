import mongoose from "mongoose";
import cron from 'node-cron';

const websiteChurnSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    age: {
        type: Number
    },
    gender: {
        type: String
    },
    avgOrder:{
        type: Number
    },
    totalMoney:{
        type: Number
    },
    productClicks:{
        type: Number
    },
    apiCalled:{
        type: Number
    },
    avgTotalRating:{
        type: Number
    }
},{
    timestamps:true
})

export const WebsiteChurn = mongoose.model("WebsiteChurn",websiteChurnSchema)

cron.schedule('0 0 1 * *', async () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    try {
        await WebsiteChurn.deleteMany({ updatedAt: { $lt: oneMonthAgo } });
        console.log('Deleted old WebsiteChurn documents');
    } catch (error) {
        console.error('Error deleting old WebsiteChurn documents:', error);
    }
});