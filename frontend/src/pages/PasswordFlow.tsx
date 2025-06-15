import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  LinearProgress,
  Chip,
  Container,
  useTheme,
  alpha,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, VpnKey, Schedule, CheckCircleOutlined } from '@mui/icons-material';
import { StyledCard, StyledTextField } from '../styles/AuthStyles';

const PASSWORD_MIN_LENGTH = 8;

interface OTPResponse {
  message: string;
  expiresIn: string;
}

const PasswordFlow: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  // Determine flow type based on current route
  const isAdminSetup = location.pathname.includes('/set-password'); // Admin setup for /set-password route
  const emailFromUrl = searchParams.get('email') || '';
  
  // Form state
  const [email, setEmail] = useState(emailFromUrl);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Flow state
  const [currentStep, setCurrentStep] = useState(0); // Always start at step 0
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const steps = [
    'Enter Email',
    'Enter OTP Code',
    'Set New Password'
  ];

  // Dynamic content based on flow type
  const content = {
    title: isAdminSetup ? 'Complete Account Setup' : 'Reset Password',
    subtitle: isAdminSetup 
      ? 'Set up your password to access your Aurora.io account'
      : 'Reset your password to regain access to your account',
    sendButtonText: isAdminSetup ? 'Send Verification Code' : 'Send Reset Code',
    setButtonText: isAdminSetup ? 'Set Password' : 'Reset Password',
    loadingText: isAdminSetup ? 'Setting Password...' : 'Resetting Password...',
    successMessage: isAdminSetup
      ? 'Account setup complete! You can now login with your new password.'
      : 'Password reset complete! You can now login with your new password.',
    finalMessage: isAdminSetup 
      ? 'Password set successfully! Redirecting to login...'
      : 'Password reset successfully! Redirecting to login...'
  };

  // Countdown timer effect
  useEffect(() => {
    if (!otpExpiry) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiryTime = otpExpiry.getTime();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setError('OTP has expired. Please request a new code.');
        setOtpExpiry(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiry]);

  // Don't auto-request OTP anymore - let user initiate to avoid flow mismatches
  // The error handling in handleRequestOTP will redirect to correct flow if needed

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleRequestOTP = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/request-password-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          type: isAdminSetup ? 'password_setup' : 'password_reset'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle flow mismatch - redirect to correct flow with user feedback
        if (errorData.message?.includes('should use password setup')) {
          setError('This account requires admin setup. Redirecting to setup flow...');
          setTimeout(() => {
            navigate(`/set-password?email=${encodeURIComponent(email)}`);
          }, 2000);
          return;
        } else if (errorData.message?.includes('should use password reset')) {
          setError('This account should use password reset. Redirecting to forgot password...');
          setTimeout(() => {
            navigate('/forgot-password');
          }, 2000);
          return;
        }
        
        throw new Error(errorData.message || 'Failed to send OTP');
      }

      const data: OTPResponse = await response.json();
      setSuccess(`OTP sent to ${email}. Check your email for the 6-digit code.`);
      setOtpSent(true);
      setCurrentStep(1);
      
      // Set expiry time (10 minutes from now)
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
      setOtpExpiry(expiryTime);
      setTimeLeft(10 * 60); // 600 seconds
      setResendCountdown(60); // 1 minute resend countdown
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/verify-password-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          otpCode: otpCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid OTP code');
      }

      const responseData = await response.json();
      setSuccess('OTP verified successfully! Now set your new password.');
      setCurrentStep(2);
      
      // Reset timer to fresh 10 minutes for password setting (following Google/industry standard)
      const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
      setOtpExpiry(expiryTime);
      setTimeLeft(10 * 60); // Fresh 10 minutes
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword.trim()) {
      setError('Password is required');
      return;
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/set-password-after-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          newPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set password');
      }

      setPasswordSet(true);
      setSuccess(content.finalMessage);
      setOtpExpiry(null); // Clear timer
      
      // Redirect to login after 3 seconds with countdown
      let countdown = 3;
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          setSuccess(`${content.finalMessage} Redirecting in ${countdown}...`);
        } else {
          clearInterval(countdownInterval);
          navigate('/login', { 
            state: { 
              message: content.successMessage,
              email: email
            }
          });
        }
      }, 1000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (resendCountdown > 0) return; // Prevent resend during countdown
    
    setOtpCode('');
    setError(null);
    setSuccess(null);
    setOtpSent(false);
    setOtpExpiry(null);
    setTimeLeft(0);
    handleRequestOTP();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <StyledTextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleRequestOTP}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VpnKey />}
              sx={{ 
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
                '&:disabled': {
                  background: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                }
              }}
            >
              {loading ? 'Sending...' : content.sendButtonText}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We've sent a 6-digit code to <strong>{email}</strong>
            </Typography>
            
            {/* Timer Display */}
            {otpExpiry && timeLeft > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Code expires in:
                  </Typography>
                  <Chip 
                    icon={<Schedule />}
                    label={formatTime(timeLeft)}
                    color={timeLeft < 60 ? 'error' : timeLeft < 300 ? 'warning' : 'primary'}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(timeLeft / 600) * 100} 
                  color={timeLeft < 60 ? 'error' : timeLeft < 300 ? 'warning' : 'primary'}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}

            {/* Modern OTP Input with individual cubes */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Enter the 6-digit code sent to your email
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5, 
                justifyContent: 'center',
                mb: 2
              }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Box
                    key={index}
                    component="input"
                    value={otpCode[index] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 1) {
                        const newOtpCode = otpCode.split('');
                        newOtpCode[index] = value;
                        setOtpCode(newOtpCode.join('').slice(0, 6));
                        
                        // Auto-focus next input
                        if (value && index < 5) {
                          const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                          nextInput?.focus();
                        }
                      }
                    }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      // Handle backspace
                      if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
                        const prevInput = e.currentTarget.parentElement?.children[index - 1] as HTMLInputElement;
                        prevInput?.focus();
                      }
                    }}
                    onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      setOtpCode(pastedData);
                    }}
                    maxLength={1}
                    sx={{
                      width: 48,
                      height: 56,
                      border: `2px solid ${otpCode[index] ? theme.palette.primary.main : theme.palette.divider}`,
                      borderRadius: 3,
                      backgroundColor: theme.palette.background.paper,
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      outline: 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:focus': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                        transform: 'scale(1.05)',
                      },
                      '&:hover': {
                        borderColor: theme.palette.primary.light,
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Button
              fullWidth
              variant="contained"
              onClick={handleVerifyOTP}
              disabled={loading || otpCode.length !== 6 || timeLeft <= 0}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VpnKey />}
              sx={{ 
                py: 1.5, 
                mb: 2,
                borderRadius: 3,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
                '&:disabled': {
                  background: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                }
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={handleResendOTP}
              disabled={loading || resendCountdown > 0}
              sx={{
                borderRadius: 3,
                fontWeight: 500,
                textTransform: 'none',
                color: resendCountdown > 0 ? theme.palette.text.disabled : theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: resendCountdown > 0 ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                }
              }}
            >
              {resendCountdown > 0 
                ? `Resend code in ${resendCountdown}s` 
                : "Didn't receive the code? Send again"
              }
            </Button>
          </Box>
        );

      case 2:
        // Show success state if password has been set
        if (passwordSet) {
          return (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    mb: 2,
                    animation: 'checkmark 0.5s ease-in-out',
                    '@keyframes checkmark': {
                      '0%': { transform: 'scale(0)', opacity: 0 },
                      '50%': { transform: 'scale(1.1)', opacity: 1 },
                      '100%': { transform: 'scale(1)', opacity: 1 }
                    }
                  }}
                >
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    ✓
                  </Typography>
                </Box>
                <Typography variant="h6" color="success.main" gutterBottom>
                  Password Set Successfully!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your account is now secure and ready to use.
                </Typography>
              </Box>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Redirecting to login...
              </Typography>
            </Box>
          );
        }

        return (
          <Box sx={{ mt: 2 }}>
            {/* Timer Display for Password Setting */}
            {otpExpiry && timeLeft > 0 && (
              <Box sx={{ mb: 3 }}>
                <Alert 
                  severity={timeLeft < 60 ? 'error' : timeLeft < 300 ? 'warning' : 'info'} 
                  sx={{ 
                    mb: 2,
                    transition: 'all 0.3s ease-in-out',
                    animation: timeLeft < 60 ? 'pulse 1s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.02)' },
                      '100%': { transform: 'scale(1)' }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      {timeLeft < 60 ? '⚠️ Time running out! Complete setup:' : 'Complete password setup within:'}
                    </Typography>
                    <Chip 
                      icon={<Schedule />}
                      label={formatTime(timeLeft)}
                      color={timeLeft < 60 ? 'error' : timeLeft < 300 ? 'warning' : 'primary'}
                      size="small"
                      sx={{ 
                        fontWeight: 'bold',
                        animation: timeLeft < 60 ? 'blink 1s infinite' : 'none',
                        '@keyframes blink': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.7 },
                          '100%': { opacity: 1 }
                        }
                      }}
                    />
                  </Box>
                  {/* Progress bar */}
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(timeLeft / 600) * 100} 
                      color={timeLeft < 60 ? 'error' : timeLeft < 300 ? 'warning' : 'primary'}
                      sx={{ 
                        height: 4, 
                        borderRadius: 2,
                        transition: 'all 0.3s ease-in-out'
                      }}
                    />
                  </Box>
                </Alert>
              </Box>
            )}

            {/* Expired timer warning */}
            {otpExpiry && timeLeft <= 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Time expired! Please request a new verification code.
                </Typography>
              </Alert>
            )}

            <StyledTextField
              fullWidth
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <StyledTextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            {/* Password Requirements */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Password Requirements:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography 
                  variant="body2" 
                  color={newPassword.length >= PASSWORD_MIN_LENGTH ? 'success.main' : 'text.secondary'}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  {newPassword.length >= PASSWORD_MIN_LENGTH ? '✓' : '•'} At least {PASSWORD_MIN_LENGTH} characters
                </Typography>
                <Typography 
                  variant="body2" 
                  color={newPassword === confirmPassword && newPassword ? 'success.main' : 'text.secondary'}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  {newPassword === confirmPassword && newPassword ? '✓' : '•'} Passwords match
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleSetPassword}
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < PASSWORD_MIN_LENGTH || timeLeft <= 0}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Lock />}
              sx={{ 
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.3)}`,
                },
                '&:disabled': {
                  background: loading ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)` : theme.palette.action.disabledBackground,
                  color: loading ? 'white' : theme.palette.action.disabled,
                  transform: 'none',
                  boxShadow: 'none',
                }
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} color="inherit" />
                  {content.loadingText}
                </Box>
              ) : (
                content.setButtonText
              )}
            </Button>

            {/* Additional feedback when loading */}
            {loading && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Please wait while we secure your account...
                </Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const logoPath = theme.palette.mode === 'dark' 
    ? '/aurora-dark.png'
    : '/aurora-light.png';

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <StyledCard 
          sx={{ 
            maxWidth: 500, 
            width: '100%',
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: theme.palette.mode === 'dark' 
                ? `0 12px 40px ${alpha(theme.palette.primary.main, 0.3)}`
                : '0 12px 40px rgba(0, 0, 0, 0.15)',
            }
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header with Logo */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {/* Aurora Logo */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                mb: 3
              }}>
                <img 
                  src={logoPath}
                  alt="Aurora Logo" 
                  style={{ 
                    width: '140px', 
                    height: 'auto',
                    display: 'block'
                  }} 
                />
              </Box>
              
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                {content.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                {content.subtitle}
              </Typography>
            </Box>

            {/* Modern Stepper */}
            <Stepper 
              activeStep={currentStep} 
              sx={{ 
                mb: 4,
                '& .MuiStepLabel-label': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                },
                '& .MuiStepIcon-root': {
                  fontSize: '1.5rem',
                  '&.Mui-active': {
                    color: theme.palette.primary.main,
                  },
                  '&.Mui-completed': {
                    color: theme.palette.success.main,
                  }
                },
                '& .MuiStepConnector-line': {
                  borderTopWidth: 2,
                }
              }}
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel 
                    StepIconComponent={({ active, completed }) => (
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: completed 
                            ? theme.palette.success.main 
                            : active 
                              ? theme.palette.primary.main 
                              : theme.palette.grey[300],
                          color: completed || active ? 'white' : theme.palette.grey[600],
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          transition: 'all 0.3s ease-in-out',
                        }}
                      >
                        {completed ? <CheckCircleOutlined sx={{ fontSize: 18 }} /> : index + 1}
                      </Box>
                    )}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Step Content */}
          {renderStepContent()}

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Remember your password?
              </Typography>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ 
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  }
                }}
              >
                Back to Login
              </Button>
            </Box>
          </CardContent>
        </StyledCard>
      </Box>
    </Container>
  );
};

export default PasswordFlow; 