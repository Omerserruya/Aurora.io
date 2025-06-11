import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  useTheme
} from '@mui/material';
import { useUser } from '../hooks/compatibilityHooks';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const hasVerified = useRef(false);
  const { refreshUserDetails } = useUser();

  // Store token in state when component mounts
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setVerificationToken(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [searchParams]);

  // Handle verification with stored token
  useEffect(() => {
    const verifyEmail = async () => {
      if (!verificationToken || isVerifying || hasVerified.current) {
        return;
      }

      try {
        setIsVerifying(true);
        const decodedToken = decodeURIComponent(verificationToken);
        const response = await fetch('/api/users/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: decodedToken }),
        });

        if (response.ok) {
          hasVerified.current = true;
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to the home page...');
          // Refresh user details to update verification status
          await refreshUserDetails();
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          const data = await response.json();
          setStatus('error');
          setMessage(data.message || 'Failed to verify email');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [verificationToken, navigate, refreshUserDetails, isVerifying]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {status === 'loading' && (
            <>
              <CircularProgress />
              <Typography variant="h6">Verifying your email...</Typography>
            </>
          )}

          {status === 'success' && (
            <Alert severity="success" sx={{ width: '100%' }}>
              {message}
            </Alert>
          )}

          {status === 'error' && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {message}
            </Alert>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmail; 