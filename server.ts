

import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import type { Application, NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser'; 
import { registerChatHandlers } from './src/modules/socket/chatHandler.js';
import { AppError } from './src/utils/appError.js';
import globalErrorHandler from './src/middleware/globalError.js';
import cors from 'cors';
import userRouter from './src/modules/user/user.routes.js';
import imgRouter from './src/modules/imageHandler/imgs.routes.js';
import socketAuth from './src/middleware/socket.js';


const app: Application = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: "https://chatnow26.netlify.app",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, 
  allowedHeaders: ['Content-Type', 'Authorization']
}));
const server = http.createServer(app);
app.use('/auth', userRouter);
app.use(imgRouter)
const io = new Server(server, {
  cors: {
    origin: "https://chatnow26.netlify.app",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // ضروري للسماح بالكوكيز
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

import path from 'path';
import { dbConnections } from './db/dbConnections.js';
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
io.use(socketAuth);
io.on('connection', (socket) => {
  console.log(`🚀 User Authenticated: ${socket.data.userId} (Socket ID: ${socket.id})`);
  registerChatHandlers(io, socket);
  socket.on('disconnect', () => {
    console.log('👋 User Disconnected');
  });
});
app.get('/', (req, res) => res.send('OK'));

app.all(/(.*)/, (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} Not Found`, 404))
})
app.use(globalErrorHandler)
const port =process.env.PORT || 7860;
server.listen(port, () => {
  console.log(` Server running on http://localhost:${port}`);
});
