import multer from 'multer'
import { AppError } from '../utils/appError.js'
import { v4 as uuidv4 } from 'uuid'
import type { Request } from 'express';
import fs from 'fs';
export const fileUpload = (folderName: string) => {

    const path = `uploads/${folderName}`;
    
    // إنشاء المجلد إذا لم يكن موجوداً لمنع خطأ 500
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path)
        },
        filename: (req, file, cb) => {
            cb(null, uuidv4() + "-" + file.originalname)
        }
    })

    function fileFilter(req: Request, file: Express.Multer.File, cb: any) {
        if (file.mimetype.startsWith('image')) {
            cb(null, true)
        } else {
            cb(new AppError('images only', 401), false)
        }
    }

    const upload = multer({ storage, fileFilter })
    return upload
}

export const uploadSingleFile = (fieldName: string, folderName: string) =>
    fileUpload(folderName).single(fieldName)

export const uploadMixOfFiles = (arrayOfFields: multer.Field[], folderName: string) =>
    fileUpload(folderName).fields(arrayOfFields)
