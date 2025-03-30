import '@/style/index.css';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {FcGoogle} from 'react-icons/fc';
import Logo from '../assets/logo.jpeg';
import {toast} from 'react-toastify';
import {useNavigate} from 'react-router-dom';

const api_Url= import.meta.env.VITE_API_BASE_URL;

const HomePage = ({setIsAuthenticated}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword]= useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
const navigate = useNavigate();

    // Check if the user is already authenticated from the server (for Google OAuth)
    const checkAuth = useCallback(async () => {
      try {
        const response = await fetch(`${api_Url}/api/auth/check`, {
          method: 'GET',
          credentials: 'include',  // Send cookies
        });
        if (response.ok) {
          const data = await response.json();
          if (data.isAuthenticated) {
            localStorage.setItem('isAuthenticated', 'true');
            setIsAuthenticated(true);
  navigate('/tts');
          } else {
            localStorage.removeItem('isAuthenticated');
            setIsAuthenticated(false);
        }
        }else {
          localStorage.removeItem('isAuthenticated');
          setIsAuthenticated(false);
      }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    }, [navigate, setIsAuthenticated]);
  
    useEffect(() => {
    checkAuth();
    }, [checkAuth]);
  
  
  
    const handleLogin = async (trimmedUsername) => {
  
      try{
    const response = await fetch(`${api_Url}/api/auth/login`,{
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username: trimmedUsername, password }),
    });
  
    const data = await response.json();
      if(response.ok){
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
    toast.success(`Welcome back!`, {position: 'top-right'}); 
    //redirect to TTS page on success
     navigate('/tts');
      }else{
        toast.error(data.message,{position: 'top-right'});  
      }
    }catch(error){
      console.error('Login failed: ', error);
      toast.error('Login failed. Please try again.',{postion: 'top-right'});
    }
    };
  
    const handleGoogleAuth = () =>{
      window.location.href = `${api_Url}/api/auth/google`;
    };
  
    const handleSignup = async (trimmedUsername) => {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match!', { position: 'top-right' });
        return;
      }

      try {
        const response = await fetch(`${api_Url}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ name, username: trimmedUsername, password, confirmPassword }), 
        });
        const data = await response.json();
        if (response.ok) {
          toast.success(`Signup successful!`,  {position: 'top-right'}); 
          setIsLogin(true);
          //redirect to TTS page on success
          navigate('/tts');
        } else {
          toast.error(data.message, {position: 'top-right'});
        }
      } catch (error) {
        console.error('Signup failed:', error);
        toast.error('Signup failed. Please try again.',{position: 'top-right'});
      }
    };
  
const handleSubmit = async(e) =>{
    e.preventDefault();
const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      toast.error('Please fill all the fields', { position: 'top-right' });
      return;
    }
      if(!isLogin && password !== confirmPassword){
          toast.error('Passwords do not match!', { position: 'top-right' });
          return;
      }
    try{  
if (isLogin) {
  await handleLogin(trimmedUsername);
} else {
  await handleSignup(trimmedUsername);
  }
      } catch (error) {
        toast.error(error.message || 'Authentication failed!', { position: 'top-right' });
    }
        };

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 bg-tts-background p-4">
          <div className="w-full max-w-4xl p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between transition-all">
            {/* Left Side - Brand Info */}
            <div className="w-full md:w-1/2 p-8 text-center">
              <motion.img
                src={Logo}
                alt="Logo"
                className="w-24 h-24 md:w-32 md:h-32 mb-4 rounded-full mx-auto logo"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
              />
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Text to Speech Converter</h1>
              <p className="text-sm md:text-lg">
                Welcome! Convert your text into natural-sounding speech with various voice options.
              </p>
            </div>
    
            {/* Right Side - Auth Form */}
            <div className="md:w-1/2 w-full p-4 bg-gray-200 text-gray-700 rounded-3xl shadow-md  mt-4 md:mt-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{isLogin ? 'Login' : 'Sign Up'}</h2>
    
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full p-3 mb-3 bg-gray-100 rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              <input
                type="text"
                placeholder="Enter your email"
                className="w-full p-3 mb-3 bg-gray-100 rounded-xl"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-3 mb-3 bg-gray-100 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {!isLogin && (
                <input
                  type="password"
                  placeholder="Confirm password"
                  className="w-full p-3 mb-3 bg-gray-100 rounded-xl"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}
    
              <Button
                onClick={handleSubmit}
                className="w-full py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-xl mb-3 button-pointer"
              >
                {isLogin ? 'Login' : 'Sign Up'}
              </Button>
    
              <div className="my-3 flex justify-center items-center gap-2">
                <span className="text-gray-600">or</span>
              </div>
              <Button
                onClick={handleGoogleAuth}
                className="w-full py-3 bg-white text-black border border-gray-300 rounded-xl hover:bg-gray-100 flex justify-center items-center gap-2 shadow-md transition duration-300 button-pointer" >
                <FcGoogle size={24} />
                <span className='font-semibold text-black'>Sign in with Google</span>
              </Button>
    
              <p className="mt-3 text-gray-600 text-center">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <span
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-purple-600 cursor-pointer"
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </span>
              </p>
            </div>
          </div>
        </div>
      );
    };

      export default HomePage;
