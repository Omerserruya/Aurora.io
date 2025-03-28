import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Visualization from './pages/Visualization';
import IAC from './pages/IAC';
import About from './pages/About';
import Settings from './pages/Settings';
import { UserProvider } from './contexts/UserContext';
import { AccountProvider } from './contexts/AccountContext';
import ThemeProvider from './theme/ThemeProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './components/OAuthCallback';
import ScrollToTop from './components/ScrollToTop';
import { SearchProvider } from './contexts/SearchContext';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AccountProvider>
          <SearchProvider>
            <ScrollToTop />
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              
              {/* Main routes */}
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/visualization" element={<Visualization />} />
                <Route path="/iac" element={<IAC />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/about" element={<About />} />
                <Route path="/setting" element={<Settings />} />
              </Route>
            </Routes>
          </SearchProvider>
        </AccountProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;