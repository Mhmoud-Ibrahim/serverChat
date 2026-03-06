import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError.js";


export  const validate = (schema:any) => {
  return (req: Request, res: Response, next: NextFunction)=>{
    let {error} = schema.validate(req.body,{abortEarly:false})
    if(!error){
      next()
    }else{
        let errMsg = error.details.map((err:any) => err.message)
        next(new AppError(errMsg,400))
    }
  }
};

