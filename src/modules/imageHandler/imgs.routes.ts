import { uploadMessageImage, uploadProfileImage } from './imgesHandler.js';
import { uploadSingleFile } from '../../middleware/fileUpload.js';


import { Router } from "express";
import { authenticate } from '../../middleware/authintecate.js';

const imgRouter = Router()

imgRouter
    .post('/imageMessage',authenticate, uploadSingleFile('image', 'messages'), uploadMessageImage)
    .post('/profileImage',authenticate, uploadSingleFile('image', 'profiles'), uploadProfileImage)






export default imgRouter