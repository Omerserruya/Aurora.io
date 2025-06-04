import React, { useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import MandatoryPasswordChangeDialog from './MandatoryPasswordChangeDialog';
import { useFirstTimeLogin } from '../hooks/useFirstTimeLogin';

interface FirstTimeLoginHandlerProps {
  children: React.ReactNode;
}

export default function FirstTimeLoginHandler({ children }: FirstTimeLoginHandlerProps) {
  const { isFirstTimeLogin, isLoading, markPasswordChanged } = useFirstTimeLogin();
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');
  const [toastOpen, setToastOpen] = useState(false);

  const handlePasswordChanged = () => {
    markPasswordChanged();
    setToastMessage('Password updated successfully! You can now continue using the application.');
    setToastSeverity('success');
    setToastOpen(true);
  };

  const handleError = (error: string) => {
    setToastMessage(error);
    setToastSeverity('error');
    setToastOpen(true);
  };

  const handleToastClose = () => {
    setToastOpen(false);
  };

  // Don't render children if loading or if first time login dialog should be shown
  if (isLoading) {
    return null; // Or a loading spinner if you prefer
  }

  return (
    <>
      {/* Render children only if not first time login */}
      {!isFirstTimeLogin && children}
      
      {/* Mandatory password change dialog */}
      <MandatoryPasswordChangeDialog
        open={isFirstTimeLogin}
        onPasswordChanged={handlePasswordChanged}
        onError={handleError}
      />

      {/* Toast notifications */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toastSeverity}
          sx={{ width: '100%' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
} 