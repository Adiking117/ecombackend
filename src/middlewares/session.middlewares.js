import { asyncHandler } from '../utils/asyncHandler.js';
import { startSession,endSession } from '../controllers/user.controllers.js';

export const start = asyncHandler(async (req, res, next) => {
    if (req.user) {
        await startSession(req.user._id);
    }
    next();
})

export const end = asyncHandler(async (req, res, next) => {
    if (req.user) {
        await endSession(req.user._id);
    }
    next();
})