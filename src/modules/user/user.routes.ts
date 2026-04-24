
import { Router } from "express";
import {    createGroup, getAllUsers, getMyProfile, getUserById, getUserGroups, logout, signin, signup } from "./user.controller.js";
import { authenticate } from "../../middleware/authintecate.js";
import { uploadSingleFile } from "../../middleware/fileUpload.js";
import passport from 'passport';
import * as authController from './user.controller.js';
const userRouter =Router()

userRouter
.post('/signup',signup)
.post('/signin',signin)
.post('/logout',logout)
.get('/me',getMyProfile)
.get('/user',getUserById)
.get('/all',authenticate,getAllUsers)
.post('/groups', authenticate,uploadSingleFile('image', 'groups'), createGroup)
.get('/groups', authenticate, getUserGroups)

userRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
userRouter.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: 'https://netlify.app' }),
    authController.googleAuthSuccess
);


export default userRouter