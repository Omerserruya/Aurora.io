import { useState, useEffect } from 'react';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: string;
  authProvider: 'google' | 'github' | 'local';
  firstTimeLogin?: boolean;
  lastLogin: string;
}

export const useFirstTimeLogin = () => {
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkFirstTimeLogin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/profile/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // User not authenticated or other error
        setIsFirstTimeLogin(false);
        return;
      }

      const userProfile: UserProfile = await response.json();
      
      // Check if user is local auth provider and has firstTimeLogin set to true
      if (userProfile.authProvider === 'local' && userProfile.firstTimeLogin === true) {
        setIsFirstTimeLogin(true);
      } else {
        setIsFirstTimeLogin(false);
      }
    } catch (error) {
      console.error('Error checking first time login:', error);
      setError('Failed to check login status');
      setIsFirstTimeLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const markPasswordChanged = () => {
    setIsFirstTimeLogin(false);
  };

  useEffect(() => {
    checkFirstTimeLogin();
  }, []);

  return {
    isFirstTimeLogin,
    isLoading,
    error,
    markPasswordChanged,
    recheckFirstTimeLogin: checkFirstTimeLogin
  };
}; 