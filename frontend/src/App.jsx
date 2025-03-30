import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home.jsx';
import TTSApp from './pages/TTS.jsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const api_Url= import.meta.env.VITE_API_BASE_URL;

const ProtectedRoute = ({ element }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  return isAuthenticated ? element : <Navigate to='/' />;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() =>{
const authState = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(!!authState);
  }, []);

 
  const handleLogout = async() => {
    try {
      const response = await fetch(`${api_Url}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',  // Include cookies for session handling
      });
  
      if (response.ok) {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    window.location.href = '/';  // Redirect to login page
  } else {
    const data = await response.json();
    toast.error(`Logout failed: ${data.message}`,{position: 'top-right'});
  }
} catch (error) {
  console.error('Logout failed:', error);
  toast.error('Logout failed. Please try again.',{position: 'top-right'});
}
  };

 return (
    <Router>
      <ToastContainer />
      <ErrorBoundary>
              <Routes>
        <Route path='/' element={
          <HomePage
          setIsAuthenticated={setIsAuthenticated}  />} />
        <Route path='/tts'
         element={<ProtectedRoute element=
        {<TTSApp onLogout={handleLogout} /> } />} />
       <Route path='/history' element={<ProtectedRoute element={<History />} />} />
      </Routes>
      </ErrorBoundary>
   </Router>
  );
};

export default App;
