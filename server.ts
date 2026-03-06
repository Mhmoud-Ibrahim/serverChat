import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import type { Application, NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser'; 
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // لإصلاح مسار الملفات

// استيراد الملفات الخاصة بالمشروع
import { registerChatHandlers } from './src/modules/socket/chatHandler.js';
import { AppError } from './src/utils/appError.js';
import globalErrorHandler from './src/middleware/globalError.js';
import userRouter from './src/modules/user/user.routes.js';
import imgRouter from './src/modules/imageHandler/imgs.routes.js';
import socketAuth from './src/middleware/socket.js';
import { dbConnections } from './db/dbConnections.js';

// تشغيل اتصال قاعدة البيانات
await dbConnections();

const app: Application = express();

// إعدادات المسارات لـ ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },allowEIO3: true
});

// المسارات (Routes)
app.use('/auth', userRouter);
app.use(imgRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// إعدادات Socket.io
 io.use(socketAuth);
io.on('connection', (socket) => {
  console.log(`🚀 User Authenticated: ${socket.data.userId} (Socket ID: ${socket.id})`);
  registerChatHandlers(io, socket);
  socket.on('disconnect', () => {
    console.log('👋 User Disconnected');
  });
});

app.get('/', (req, res) => res.send('OK its working .....'));

// معالجة المسارات غير الموجودة
app.all(/(.*)/, (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} Not Found`, 404))
});

// معالج الأخطاء العام
app.use(globalErrorHandler);

const port = process.env.PORT || 7860;
server.listen(port, () => {
  console.log(` Server running on http://localhost:${port}`);
});
