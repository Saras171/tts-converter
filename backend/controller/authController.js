import bcrypt from "bcrypt";
import {supabase} from '../config/databaseConfig.js';
import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();
const saltRounds = process.env.SALT_ROUNDS;


// Auth Check Controller
export const checkAuth = (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ isAuthenticated: true, user: req.user });
    }
    return res.json({ isAuthenticated: false });
  };
// Signup Controller
export const signup = async (req, res) => {
    const { name,username, password } = req.body;

    // Input validation
    if (!name || !password || !username) {
        return res.status(400).json({ message: 'Username, password, and email are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        //check if user already exist or not
const { data: existingUser,error: userCheckError } = await supabase
.from('users')
.select('*')
.eq('username', username)
.maybeSingle();

if (userCheckError) {
    console.error("Supabase Error (checking user):", userCheckError);
    return res.status(500).json({ message: 'Database query error.' });
}

if (existingUser) {
return res.status(400).json({ message: 'User already exists. Please login.' });
}

//Insert the new user
const { data: userDetails, error } = await supabase
        .from('users')
        .insert({
             name: name,
             username: username,
             password: hashedPassword,
             isverified: true,
              })
              .select('*')
              .single();

        if (error){
            console.error('Supabase Error (checking user):', error.message);
            return res.status(500).json({message:'User creation failed'});
        }

        //log the user in after successful signUp
        req.login(userDetails, (err) =>{
            if (err) {
                console.error('Error during login after signup: ',err);
                return res.status(500).json({ message: 'Login after signup failed' });
            }

            //redirect to TTS page on successful signup
            console.log("User created successfully: ", userDetails);
             return res.json({message: 'User created successfully!', redirectUrl: '/tts', user: userDetails});
});

        } catch (error) {
        console.error(`Signup error: ${error.message}`);
        res.status(500).json({ message: 'Error creating user' });
    }
};

// Login Controller
export const login = async(req, res, next) =>{
  console.log('Login attempt with username: ', req.body);

    passport.authenticate('local', (err, user, info) =>{
    if (err) {
console.error('Passport authentication error: ', err.message);
        return res.status(500).json({message: 'Internal Server Error: ', error:err.message});
  }
if (!user) {
console.warn('Authentication failed: ', info.message);
    return res.status(401).json({message: info.message || 'Invalid username or password'}); 
   }

   console.log('User authenticated successfully: ', user.username);
  
   //check if the user is verified/authenticated
   if(user.verified === false){
    return res.status(403).json({message: 'User is not verified. Please verify your email.'});  
   }
   //log the user in
   req.login(user,(err) =>{
    if (err) {
console.error("Error during login: ", err.message);
        return res.status(500).json({message: 'Error logging in user', error: err.message});
        }

          // Set isAuthenticated in session
      req.session.isAuthenticated = true;
      console.log("User logged in successfully:", user.username);

        //redirect to TTS page on successful login
        console.log("User logged in successfully:", user.username);
        return res.json({message: 'User logged in successfully',redirectUrl: '/tts', user});  
   });
}) (req, res, next);
};

// Google OAuth Callback
export const googleCallback = (req, res) => {
   try{
    console.log('Google OAuth callback successful!');
    // Set authentication state in the session
    req.login(req.user, (err) => {
        if (err) {
            console.error("Error during login after Google OAuth:", err.message);
            return res.status(500).json({ message: "Login after Google OAuth failed" });
        }

          // Set isAuthenticated in session
          req.session.isAuthenticated = true;
          console.log("User logged in via Google OAuth:", req.user.username);
    });  
}catch (error){
    console.error('Error during Google OAuth Callback: ', error.message);
    res.status(500).json({message: 'Google OAuth callback failed!'});
   }
};

// Logout Controller
export const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("Error during logout:", err.message);
            return res.status(500).json({ message: 'Logout failed' });
        }
        req.session.destroy((destroyErr) => {
            if (destroyErr) {
                console.error("Error destroying session:", destroyErr.message);
                return res.status(500).json({ message: 'Session destruction failed' });
            }
            res.clearCookie('connect.sid');  // Clear the session cookie
            console.log("User logged out successfully!");
            return res.json({ message: 'User logged out successfully' });
        });
    });
};