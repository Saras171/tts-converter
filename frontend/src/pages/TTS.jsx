import '@/style/index.css';
import Logo from '@/assets/logo.jpeg';
import React, { useState, useEffect } from 'react';
import {Loader2, Trash} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const api_Url=import.meta.env.VITE_API_BASE_URL;
const socket = io(import.meta.env.VITE_API_BASE_URL);

const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'ko-KR', name: 'Korean (South Korea)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'ru-RU', name: 'Russian (Russia)' }
];

function TTSApp({ onLogout}) {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [gender, setGender] = useState('MALE');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0.0);
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 770);
 
  // Define voice mapping for male and female voices
const getVoiceName = (language, gender) => {
  const maleVoices = {
      'en-US': 'en-US-Wavenet-D',
      'en-GB': 'en-GB-Wavenet-D',
      'hi-IN': 'hi-IN-Standard-B',  
      'fr-FR': 'fr-FR-Wavenet-D',
      'de-DE': 'de-DE-Wavenet-D',
      'es-ES': 'es-ES-Standard-B',
      'ja-JP': 'ja-JP-Standard-B',
      'ko-KR': 'ko-KR-Standard-B',
      'it-IT': 'it-IT-Standard-D',
      'ru-RU': 'ru-RU-Wavenet-D'
  };
  const femaleVoices = {
      'en-US': 'en-US-Wavenet-F',
      'en-GB': 'en-GB-Wavenet-F',
      'hi-IN': 'hi-IN-Standard-A',  
      'fr-FR': 'fr-FR-Wavenet-E',
      'de-DE': 'de-DE-Wavenet-E',
      'es-ES': 'es-ES-Standard-A',
      'ja-JP': 'ja-JP-Standard-A',
      'ko-KR': 'ko-KR-Standard-A',
      'it-IT': 'it-IT-Standard-C',
      'ru-RU': 'ru-RU-Wavenet-C'
  };
  return gender.toUpperCase() === 'MALE' ? maleVoices[language] : femaleVoices[language];
};

useEffect(() => {
  // Listen for audio generation events
  socket.on('audioGenerated', (data) => {
    console.log("Socket event received: audioGenerated", data);

      if (data?.success) {
          // Display the generated audio file immediately
          if (data.url) {
            setAudioUrl(data.url);
            toast.success('Audio file generated successfully!', { position: 'top-right' });
        } else {
            toast.error('Audio URL is missing!', { position: 'top-right' });
        }
        // Safely update the history with the new file
      if (data.fileData && data.fileData.length > 0) {
        setHistory((prevHistory) => [data.fileData[0], ...prevHistory]);
      }
    } else {
      console.error('Error generating audio file:', data?.message);
      toast.error('Error generating audio file!', { position: 'top-right' });
    }
    });
      return () => {
      socket.off('audioGenerated');
  };
}, []);


useEffect(() => {
  const authStatus = localStorage.getItem("isAuthenticated");
  if (authStatus === "true") {
    setIsAuthenticated(true);

    // Show success toast only on first navigation to TTS page
    const showToast = sessionStorage.getItem("oauthLoginToastShown");
    if (!showToast) {
      toast.success("Successfully logged in or signed up!", { position: "top-right" });
      sessionStorage.setItem("oauthLoginToastShown", "true");
    }
  }
}, []);

useEffect(() => {
  const handleResize = () => {
      setIsMobile(window.innerWidth < 770);
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);


  // Fetch audio history from the backend
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${api_Url}/api/tts/history`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      } else {
        console.error('Error fetching history: ', data.message);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);


  const handleGenerate = async () => {
    if (!text) {
      toast.error('Please enter some text to convert.', {position: 'top-right'});
      return;
  }
    setLoading(true);
    try {
      const voiceName = getVoiceName(language,gender);
  const response = await fetch(`${api_Url}/api/tts/generate`,{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        text: text,
        languageCode: language,
        voice: voiceName,
        speed,
        pitch, 
        }), 
});

const data = await response.json();

if(!response.ok){
  throw new Error(data.message || 'Failed to generate speech!');
}
setAudioUrl(data.url);
 // Immediately add the new file to the history list
 setHistory((prevHistory) => [data.fileData, ...prevHistory]);
setText('');
} catch (error) {
  console.error('Error generating audio: ', error);
  toast.error("An error occur while generating audio.", {position: 'top-right'});
  } finally {
    setLoading(false);
    }
    };

    const handleLogout = async () => {
      try {
        await onLogout();
        toast.success('Logged Out Successfully!',{position: 'top-right'});

      } catch (error) {
        console.error('Error during logout:', error);
        toast.error('Logout failed. Please try again.', {position: 'top-right'});
      }
    };

    const handleDelete = async (id) => {
      try {
        const response = await fetch(`${api_Url}/api/tts/delete/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
    
        const data = await response.json();
    
        if (response.ok) {
          toast.success(data.message, { position: 'top-right' });

          // Remove the deleted item from the history state
          setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Error deleting audio file:', error);
        toast.error('Failed to delete audio file.', { position: 'top-right' });
      }
    };
    
  return (
    <div className= 'flex items-center justify-center min-h-screen bg-gray-100 bg-tts-background  h-auto p-4'>
   <div className={`flex ${historyVisible ? 'flex-row' : 'flex-col'} transition-all duration-700 ease-in-out`}>
        {/* TTS Card */}
        <motion.div
          className={`transition-all duration-500 ease-in-out ${historyVisible ? 'transform translate-x-[-10%]' : ''}`}>
    <Card className=" w-full max-w-2xl bg-gray-200 shadow-inner rounded-3xl ">
 <div className="flex tts-container">
  {/**Left column (40%) */}
  <div className=" small-div-1 w-2/5 p-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white header-section">
   <h1 className="text-4xl font-bold mb-4">Wecome to Text to Speech</h1>
{/* Animated Logo */}
<motion.img
    src={Logo}
    alt="TTS Logo"
    className="w-24 h-24 mb-4 animate-pulse rounded-full mx-auto  logo"
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1.0, ease: "easeOut" }}
  />
         
      {/* Animated Paragraph */}
  <motion.p
    className="text-lg"
    initial={{ x: -100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ duration: 1.0, ease: "easeOut", delay: 0.5 }}
  >
    Easily convert your text into natural-sounding speech with various voice options and control settings.
  </motion.p>
          </div>
          {/**Right column (60%) */}
<div className="w-3/5 p-8 converter-section">
  <CardContent>
    <h2 className="text-3xl font-bold text-gray-700 mb-6">Text-to-Speech Converter</h2>
    <div className='flex justify-between items-center mb-4'>
    <Button
                  onClick={() => setHistoryVisible(!historyVisible)}
                  className='bg-blue-500 text-white px-4 py-2 rounded-lg  button-pointer'>
                  {historyVisible ? 'Hide History' : 'Show History'}
                </Button>        
    <Button 
     onClick={handleLogout} 
    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl  button-pointer" >
         Logout
            </Button>
    </div>
    <textarea
      className="w-full p-4 bg-gray-100 text-gray-700 border border-gray-300 rounded-xl mb-6 focus:outline-none focus:ring-4 focus:ring-purple-400 shadow-lg transition"
      placeholder="Enter text to convert..."
      rows={6}
      value={text}
      onChange={(e) => setText(e.target.value)}
    />

    <label className="text-gray-700 font-semibold">Language:</label>
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="w-full p-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-xl mb-4 shadow-md focus:outline-none"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>

    <label className="text-gray-700 font-semibold">Voice Gender:</label>
    <div className="flex justify-around mb-4">
      <label className="text-gray-700 font-medium">
        <input
          type="radio"
          name="gender"
          value="MALE"
          checked={gender === 'MALE'}
          onChange={() => setGender('MALE')}
          className="mr-2"
        />
        Male
      </label>
      <label className="text-gray-700 font-medium">
        <input
          type="radio"
          name="gender"
          value="FEMALE"
          checked={gender === 'FEMALE'}
          onChange={() => setGender('FEMALE')}
          className="mr-2"
        />
        Female
      </label>
    </div>

    <Button
      onClick={handleGenerate}
      className="w-full py-3 text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 button-pointer"
      disabled={loading}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="mr-2 animate-spin" />
          Generating...
        </div>
      ) : (
        'Generate Speech'
      )}
    </Button>

    {audioUrl && (
      <>
        <h3 className="text-gray-700 mt-6">Generated Audio:</h3>
        <audio
          controls
          src={audioUrl}
          className="w-full mt-4 bg-gray-100 text-gray-700 rounded-xl shadow-lg"
        ></audio>
      </>
    )}

  </CardContent>
  </div>
  </div>
</Card>
</motion.div>
{/*Hisotry card*/}
{historyVisible && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className={`p-4 mt-4 bg-white rounded-xl shadow-lg w-[400px] max-w-full history-section  ${historyVisible ? "slidedown" : ""}`}>
                    <h3 className='text-xl font-semibold mb-2'>Audio History</h3>
                    {/* Subscript Message */}
      <p className="text-xs text-gray-500 italic mt-1">
        * Refresh the page to view the latest generated audio files.
      </p>
                    {history.length === 0 ? (
                      <p>No audio history available.</p>
                    ) : (
                      <ul>
                        {history.map((item, index) => (
                          item && item.filename ? (
                          <li key={item.id || index} className='border p-2 rounded-lg mb-2 history-card'>
                       <div className='text-gray-700 font-semibold'>{item.filename}</div>
                       <div className='mt-1'>
                            <audio controls src={item.audio_url} className='w-full mt-2'></audio>
                       </div>
                         <button onClick={() => handleDelete(item.id)}
                         className="text-red-500 hover:text-red-700 transition-colors"
                         title="Delete Audio">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m-4 0h14" />
                  </svg>
                       </button>
                          </li>
                          ) : null
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
</div>
</div>);
};
export default TTSApp;


