

import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

declare module "socket.io" {
  interface Socket {
    user?: {
      userId: string;
      email: string;
      name: string;
      image?: string;
    };
  }
}

const socketAuth = (socket: Socket, next: (err?: Error) => void) => {
  try {
    // 1. جلب الكوكيز من هيدرز السوكيت
    const reqCookie = socket.handshake.headers.cookie;
    if (!reqCookie) {
      return next(new Error("Authentication error: No cookies found"));
    }

    // 2. تحليل الكوكي واستخراج التوكن
    const parsedCookies = cookie.parse(reqCookie);
    const token = parsedCookies.token; 

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    // 3. التحقق من التوكن
    const secretKey = process.env.JWT_KEY || "ChatNowSecretKey";
    const decoded = jwt.verify(token, secretKey) as any;

    // 4. تخزين البيانات في socket.user و socket.data لضمان عمل كل الوظائف
    const userData = {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      image: decoded.image
    };

    socket.user = userData;
    socket.data.userId = decoded.userId;
    socket.data.userName = decoded.name;

    next(); 
  } catch (err) {
    next(new Error("Authentication error: Invalid or expired token"));
  }
};

export default socketAuth;
