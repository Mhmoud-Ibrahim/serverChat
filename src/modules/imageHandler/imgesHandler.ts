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
    // الأفضل إرسال رابط كامل هنا لأننا نحتاج استخدامه فوراً في السوكيت قبل الحفظ
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/messages/${file.filename}`;
    
    return res.json({ 
        message: "Image uploaded successfully", 
        imageUrl // هذا هو الرابط الذي سيستخدمه السوكيت للإرسال
    });
};

// 2. تعديل رفع صورة البروفايل
export const uploadProfileImage = catchError(async (req: any, res: any, next: any) => {
    // 1. التأكد من وصول الملف (اسم الحقل 'image' كما في الراوتر)
    if (!req.file) {
        return next(new AppError('No file received. Please use field name: image', 400));
    }

    const userId = req.user.userId;

    // 2. تحديث قاعدة البيانات باسم الملف فقط
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { userImage: req.file.filename }, 
        { new: true } // هامة جداً لإرجاع الوثيقة المحدثة فوراً
    ).select("-password");

    if (!updatedUser) {
        return next(new AppError("User not found", 404));
    }

    // 3. سيحتوي الـ updatedUser تلقائياً على fulluserImage بفضل الـ Virtual
    return res.status(200).json({ 
        message: "Success", 
        user: updatedUser 
    });
});

