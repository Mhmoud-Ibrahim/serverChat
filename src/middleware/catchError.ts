
import {   type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { AppError } from '../utils/appError.js';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;
 export const catchError = (fn: AsyncFunction): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            next(new AppError(err.message || err, 500));
        });
    };
};


