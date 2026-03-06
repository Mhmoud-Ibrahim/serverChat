
import { Router } from "express";
import {    createGroup, getAllUsers, getMyProfile, getUserById, getUserGroups, logout, signin, signup } from "./user.controller.js";
import { authenticate } from "../../middleware/authintecate.js";

const userRouter =Router()

userRouter
.post('/signup',signup)
.post('/signin',signin)
.post('/logout',logout)
.get('/me',getMyProfile)
.get('/user',getUserById)
.get('/all',authenticate,getAllUsers)
.post('/groups', authenticate, createGroup)
.get('/groups', authenticate, getUserGroups)




export default userRouter