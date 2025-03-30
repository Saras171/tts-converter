// Import necessary modules
import passport from 'passport';
import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { supabase } from './databaseConfig.js';

// Local Strategy
passport.use('local',
    new LocalStrategy(
        {
        usernameField: 'username', // Adjusted to explicitly use 'username'
        passwordField: 'password', // Adjusted to explicitly use 'password'
        passReqToCallback: true,  
    }, async (req, username, password, cb) => {
    try {
        const { data, error } = await supabase //using supabase to query the database
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    //error message if user is not found
        if (error || !data || data.length === 0){
console.warn('User not found: ', username);
   return   cb(null, false,{ message: 'User not found! Try to sign Up first.' });
        }

        //compare password
        const isMatch = await bcrypt.compare(password, data.password);

        if (!isMatch) {
            console.warn("Invalid password for user:", username);
            return cb(null, false, { message: 'Incorrect password!' });
        }

        if (!data.isverified) {
            console.warn("User not verified:", username);
            return cb(null, false, { message: 'User is not verified. Please verify your email.' });
        }

        console.log("User verified successfully:", username);
        return cb(null, data);

    } catch (error) {
        console.error('Error during local strategy authentication: ', error.message);
    return cb(error);
    }
}));

// Google OAuth Strategy
passport.use('google',
    new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK,
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, cb) => {
    try {
        console.log('Google Profile Data: ', profile);

        const { data , error} = await supabase //using supabase to query the database
        .from('users')
        .select('*')
        .eq('google_id', profile.id);

        if (error) {
            console.error("Supabase Error (Finding user):", error.message);
            return cb(error, null);
          }

        if (data && data.length > 0) {
            console.log('User found: ', data[0]);
            return cb(null, data[0]);
        }

        //if user not found, create a new one
        const {data:newUser, error: insertError } = await supabase.from('users').insert({
            google_id: profile.id,
            name: profile.displayName,
            username: profile.emails[0].value,
            password:'fromGoogleAccount',
       isverified: true,
        })
        .select('*')
        .single();

        if (insertError) {
            console.error('Supabase error (inserting user):  ', insertError.message);   
            return cb(insertError, null);
            }

console.log('New user created: ', newUser);
return cb(null,newUser);
} catch (error) {
        console.error('Error during Google Oauth Strategy: ', error.message);   
        return cb(error);
    }
}));

// Serialize and Deserialize
passport.serializeUser((user, cb) => cb(null, user.id || user.google_id));

passport.deserializeUser(async (id, cb) => {
    try {
        const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${id},google_id.eq.${id}`)
        .single();

        if(error || data.length === 0) return  cb(null, false);

        cb(null, data);
    } catch (error) {
        cb(error, null);
    }
});
