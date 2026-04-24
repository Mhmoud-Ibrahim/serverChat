
import jwt from 'jsonwebtoken'
 
import bcrypt from 'bcrypt'
import { catchError } from '../../middleware/catchError.js';
import { AppError } from '../../utils/appError.js';
import type { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';
import { User } from '../../../db/models/user.model.js';

passport.use(new GoogleStrategy({
    clientID: process.env.clientID as string,
    clientSecret: process.env.clientSecret as string,
    callbackURL: "https://m2dd-serverchatapp.hf.space/auth/google/callback",
  },
  async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
        const userEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (!userEmail) {
            return done(null, false, { message: "No email found from Google profile" });
        }

        let user = await User.findOne({ email: userEmail });

        if (!user) {
            // إنشاء مستخدم جديد إذا لم يكن موجوداً
            user = await User.create({
                name: profile.displayName,
                email: userEmail,
                // كلمة سر عشوائية لأن التسجيل عبر جوجل
                password: Math.random().toString(36).slice(-10), 
                userImage: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
                googleId: profile.id,
               
            });
        } else if (!user.googleId) {
            // ربط حساب جوجل بحساب موجود مسبقاً بنفس الإيميل
            user.googleId = profile.id;
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err as Error, undefined);
    }
  }
));

// 2. دالة إرسال التوكن الموحدة (JWT + Cookie)
const sendTokenResponse = (user: any, res: Response) => {
    const token = jwt.sign(
        { userId: user._id, email: user.email, name: user.name, role: user.role },
        process.env.JWT_KEY as string,
        { expiresIn: '24h' }
    );
    
    res.cookie('noorToken', token, {
        httpOnly: true,
        secure: true, // مهم جداً لأنك ترفع على Vercel (HTTPS)
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
    });
    
    return token;
};

// 3. Auth Controllers
const signup = catchError(async (req: Request, res: Response) => {
    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) return res.status(400).json({ message: "user already exists" });
    
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({ ...req.body, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "success" });
});

const signin = catchError(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    
    if (!user) return next(new AppError('user not found', 401))
    
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect) {
        sendTokenResponse(user, res);
        return res.json({ message: "success" });
    }
    return next(new AppError('incorrect email or password ', 401))
});

const logout = catchError((req: Request, res: any) => {
    res.clearCookie('noorToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/' 
    });
    return res.json({ message: 'Logged out successfully' })
});

const getMe = catchError(async (req: any, res: Response, next: NextFunction) => {
    // جلب البيانات من الـ user المرفق بالطلب (عبر الـ middleware)
    if (!req.user) {
        return next(new AppError("Not authenticated", 401));
    }
    res.status(200).json({
        status: "success",
        data: req.user
    });
});

// 4. Google Auth Success Controller
const googleAuthSuccess = catchError(async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        sendTokenResponse(req.user, res);
        // التوجيه لصفحة الـ Home في الفرونت إند بعد نجاح الدخول
        res.redirect('noor-store-five.vercel.app'); 
    } else {
        res.redirect('noor-store-five.vercel.app');
    }
});

export {
    signup,
    signin,
    logout,
    getMe,
    googleAuthSuccess
}
