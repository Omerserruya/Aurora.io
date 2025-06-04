import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Visualization from './pages/Visualization';
import IAC from './pages/IAC';
import About from './pages/About';
import Settings from './pages/Settings';
import AWSArchitectureVisualizationDemo from './pages/AWSArchitectureVisualizationDemo';
import ThemeProvider from './theme/ThemeProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './components/OAuthCallback';
import ScrollToTop from './components/ScrollToTop';
import FirstTimeLoginHandler from './components/FirstTimeLoginHandler';
import { useAppDispatch } from './store/hooks';
import { refreshUserDetails } from './store/slices/userSlice';
import { refreshAccountDetails } from './store/slices/accountSlice';
import Users from './pages/admin/Users';
import EditUser from './pages/admin/EditUser';

function App() {
  const dispatch = useAppDispatch();

  // Load user and account data on app start
  useEffect(() => {
    dispatch(refreshUserDetails());
    dispatch(refreshAccountDetails());
  }, [dispatch]);

  return (
    <ThemeProvider>
      <ScrollToTop />
      <Routes>
        {/* Auth routes - outside FirstTimeLoginHandler */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        
        {/* Protected routes - wrapped with FirstTimeLoginHandler */}
        <Route path="/*" element={
          <FirstTimeLoginHandler>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/visualization" element={<Visualization />} />
                <Route path="/aws-demo" element={<AWSArchitectureVisualizationDemo />} />
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
          </FirstTimeLoginHandler>
        } />
      </Routes>
    </ThemeProvider>
  );
}

export default App;