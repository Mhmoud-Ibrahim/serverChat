import type { NextFunction, Request, Response } from "express";

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

    const statusCode = Number(err.statusCode) || 500;

    const status = err.status || 'error';
    const message = err.message || 'Internal Server Error';
    if (process.env.MODE === 'development') {
        res.status(statusCode).json({
            status: status,
            error: message,
            stack: err.stack
        });
    } else {
        res.status(statusCode).json({
            status: status,
            error: message
        });
    }
};

export default globalErrorHandler;
