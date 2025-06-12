import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Visualization from './pages/Visualization';
import IAC from './pages/IAC';
import About from './pages/About';
import Settings from './pages/Settings';
import ThemeProvider from './theme/ThemeProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import OAuthCallback from './components/OAuthCallback';
import ScrollToTop from './components/ScrollToTop';
import FirstTimeLoginHandler from './components/FirstTimeLoginHandler';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { refreshUserDetails } from './store/slices/userSlice';
import { initializeAccountFromStorage } from './store/slices/accountSlice';
import Users from './pages/admin/Users';
import EditUser from './pages/admin/EditUser';

function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);

  // Load user data on app start
  useEffect(() => {
    dispatch(refreshUserDetails());
  }, [dispatch]);

  // Initialize account from storage when user becomes available
  useEffect(() => {
    if (user?._id) {
      dispatch(initializeAccountFromStorage(user._id));
    }
  }, [dispatch, user?._id]);

  return (
    <ThemeProvider>
      <ScrollToTop />
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Landing />} />
        
        {/* Auth routes - outside FirstTimeLoginHandler */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        
        {/* Protected routes - wrapped with FirstTimeLoginHandler */}
        <Route element={
          <FirstTimeLoginHandler>
            <Layout />
          </FirstTimeLoginHandler>
        }>
          <Route path="/home" element={<Home />} />
          <Route path="/visualization" element={<Visualization />} />
          <Route path="/iac" element={<IAC />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
          <Route path="/setting" element={<Settings />} />
          
          {/* Admin routes */}
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/users/edit/:userId" element={<EditUser />} />
          <Route path="/admin/users/create" element={<EditUser />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;