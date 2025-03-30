// Import necessary modules
import express from 'express';
import passport from 'passport';
import { signup,login, googleCallback,checkAuth, logout } from '../controller/authController.js';
import dotenv from 'dotenv';
dotenv.config();

const authRouter = express.Router();

// Signup Route
authRouter.post('/signup', signup);

// Login Route
authRouter.post('/login', login);
   
//auth check route
authRouter.get('/check',checkAuth);
// Google OAuth Routes
authRouter.get('/google',
         passport.authenticate('google',
                 { scope: ['profile', 'email'] }));
authRouter.get('/google/callback',
     passport.authenticate('google', 
        { successRedirect: `${process.env.CLIENT_SITE}/tts`,
        failureRedirect: '/login' }), googleCallback);

// Logout Route
authRouter.post('/logout', logout);

export default authRouter;


