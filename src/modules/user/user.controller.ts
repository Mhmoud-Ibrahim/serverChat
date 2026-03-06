
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { catchError } from '../../middleware/catchError.js';
import { AppError } from '../../utils/appError.js';
import type { NextFunction, Request, Response } from 'express';
import { User } from '../../../db/models/user.model.js';
import { Room } from '../../../db/models/room.model.js';

interface MyToken {
  userId: string; 
  email:string;
  name: string;
  image: string;
  iat?: number;
  exp?: number;
}


//signup
const signup = catchError(async (req, res) => {
    const user = await User.findOne({ email: req.body.email })
    if (user) return res.status(400).json({ message: "user already exists" })
    const hashpassword = bcrypt.hashSync(req.body.password, 10)
    req.body.password = hashpassword
        let newuser = new User(req.body)
    await newuser.save()
    res.json({ message: "success" })
})

const signin = catchError(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError('Invalid email or password', 401));
    }
    const token = jwt.sign(
        { userId: user._id, name: user.name , email: user.email , image: user.userImage }, 
        process.env.JWT_KEY as string || "ChatNowSecretKey", 
        { expiresIn: '7d' }  // جعلناها 7 أيام لتطابق الكوكي
    );
    const cookieOptions = {
        httpOnly: true,
        secure: true, // يجب أن يكون true في الإنتاج (HTTPS)
        sameSite: 'none' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie('token', token, cookieOptions);
    
    // إرسال الـ userId في الـ response كافي جداً ولا داعي لكوكي إضافي له
    res.status(200).json({ 
        message: "success", 
        user: { name: user.name, id: user._id , email: user.email , image: user.userImage } 
    });
});


const logout = catchError((req:Request, res:any) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure:true,
        sameSite: 'none',
        
    });
    return res.json({ message: 'Logged out successfully' })
})


const getMyProfile = catchError(async (req, res, next) => {
    const token = req.cookies.token; 

    if (!token) {
        return next(new AppError('غير مسجل دخول، يرجى تسجيل الدخول ثانية', 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY  as string) as MyToken;

    const user = await User.findById(decoded.userId) ;

    if (!user) {
        return next(new AppError('هذا المستخدم لم يعد موجوداً', 404));
    }
    return res.json({ 
        status: 'success',
        user 
    });
});

const getUserById = catchError(async (req, res, next) => {
    const { id } = req.body
    const user = await User.findById(id);
    if (!user) {
        return next(new AppError('user not found', 404));
    }
    return res.json({ 
        status: 'success',
        user 
    });
});
// get all users
const getAllUsers = catchError(async (req: Request, res: Response) => {
     const currentUserId = req.user.userId;
   const users = await User.find({ _id: { $ne: currentUserId } })
                            .select('name userImage fulluserImage');

    res.status(200).json({
        status: 'success',
        users
    });
});

 const createGroup = catchError(async (req: any, res: Response, next: NextFunction) => {
    const { name, members } = req.body; // members: مصفوفة IDs للأصدقاء
    const adminId = req.user.userId;
    if (!name || !members || !Array.isArray(members) || members.length === 0) {
        return next(new AppError('  please provide name and members   ', 400));
    }
    // التأكد من إضافة صاحب المجموعة (الأدمن) للأعضاء تلقائياً
    const allMembers = Array.from(new Set([...members, adminId]));

    const newGroup = new Room({
        name,
        admin: adminId,
        members: allMembers,
        isGroup: true,
        // إذا رفعت صورة للمجموعة، استخدم req.file.filename (تحتاج Multer في الراوتر)
        groupImage: req.file ? req.file.filename : 'group-default.png'
    });

    await newGroup.save();

    // عمل Populate للأعضاء لإرجاع بياناتهم فوراً للفرونت اند
    const populatedGroup = await Room.findById(newGroup._id)
        .populate('members', 'name userImage fulluserImage')
        .populate('admin', 'name');

    res.status(201).json({
        message: "Group created successfully",
        group: populatedGroup
    });
});

// 4. جلب جميع المجموعات التي انضم إليها المستخدم (لعرضها في القائمة)
 const getUserGroups = catchError(async (req: any, res: Response) => {
    const currentUserId = req.user.userId;

    const groups = await Room.find({ members: currentUserId })
        .populate('members', 'name userImage fulluserImage')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: groups.length,
        groups
    });
});

export {
    signup,
    signin,
    logout,
    getMyProfile,
    getUserById,
    getAllUsers,
    createGroup,    
    getUserGroups  
}