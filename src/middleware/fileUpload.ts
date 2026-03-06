import multer from 'multer'
import { AppError } from '../utils/appError.js'
import { v4 as uuidv4 } from 'uuid'
import type { Request } from 'express';

export const fileUpload = (folderName: string) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `uploads/${folderName}`)
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
