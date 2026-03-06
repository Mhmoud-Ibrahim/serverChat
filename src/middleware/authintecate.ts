// import jwt from "jsonwebtoken";
// import type { NextFunction, Request, Response } from "express";
// import { AppError } from "../utils/appError.js";
// import { Socket } from "socket.io";


// declare module "socket.io" {
//   interface Socket {
//     user?: {
//       userId: string;
//       email: string;
//       name: string;
//       userImage?: string;
//       iat?: number;
//       exp?: number;
//     };
//   }
// }
// interface MyToken {
//     userId: string; 
//     email: string;
//     name: string;
//     image: string;
//     iat?: number;
//     exp?: number;
// }

// export const authenticate = (req: any, res: Response, next: NextFunction) => {
//     const token = req.cookies.token; 
//     if (!token) {
//         return next(new AppError("يرجى تسجيل الدخول أولاً، التوكن غير موجود", 401));
//     }
//     try {
//         const secretKey = process.env.JWT_KEY as string;
//         const decoded = jwt.verify(token, secretKey) as MyToken;
//         req.user = decoded; 
//          Socket.user = decoded;
//         return next();
//     } catch (error) {
//         return next(new AppError( "please login unauthorized", 401));
//     }
// };
// // 

import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError.js";

// واجهة التوكن الموحدة
interface MyToken {
    userId: string; 
    email: string;
    name: string;
    image?: string;
    iat?: number;
    exp?: number;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    // 1. قراءة التوكن من الكوكيز
    const token = req.cookies.token; 
    
    if (!token) {
        return next(new AppError("يرجى تسجيل الدخول أولاً، التوكن غير موجود", 401));
    }

    try {
        // 2. التحقق من التوكن
        const secretKey = process.env.JWT_KEY || "ChatNowSecretKey";
        const decoded = jwt.verify(token, secretKey) as MyToken;

        // 3. تخزين البيانات في req.user (هنا لا نستخدم Socket إطلاقاً)
        req.user = decoded; 
        
        return next();
    } catch (error) {
        return next(new AppError("الجلسة منتهية، يرجى تسجيل الدخول", 401));
    }
};
