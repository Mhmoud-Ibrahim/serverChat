import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/appError.js";
import { User } from "../../../db/models/user.model.js";
import { catchError } from "../../middleware/catchError.js";

// 1. تعديل رفع صور الرسائل
export const uploadMessageImage = (req: Request, res: Response, next: NextFunction) => {
    const file = req.file as Express.Multer.File;

    if (!file) {
        return next(new AppError('No file uploaded', 400));
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/messages/${file.filename}`;
    
    return res.json({ 
        message: "Image uploaded successfully", 
        imageUrl 
    });
};
export const uploadProfileImage = catchError(async (req: any, res: any, next: any) => {
    if (!req.file) {
        return next(new AppError('No file received. Please use field name: image', 400));
    }
    const userId = req.user.userId || req.user._id|| req.user.id;
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { userImage: req.file.filename }, 
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        return next(new AppError("User not found", 404));
    }
    return res.status(200).json({ 
        message: "Success", 
        user: updatedUser 
    });
});

