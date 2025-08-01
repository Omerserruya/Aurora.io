import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Link,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  CardContent,
  Divider,
  IconButton,
  useTheme,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { StyledBackground, SocialButton } from '../styles/AuthStyles';
import { useUser } from '../hooks/compatibilityHooks';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import { Theme } from '@mui/material/styles';
import { gray } from '../shared-theme/themePrimitives';

interface LoginFormData {
  email: string;
  password: string;
}

const StyledCard = styled(Card)(({ theme }: { theme: Theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 4px 20px rgba(0, 0, 0, 0.5)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)',
  borderRadius: 16,
  width: '100%',
  padding: theme.spacing(4),
}));

const StyledTextField = styled(TextField)(({ theme }: { theme: Theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderColor: theme.palette.mode === 'dark' ? gray[700] : gray[300]
    },
    '&:hover fieldset': {
      borderColor: theme.palette.mode === 'dark' ? gray[600] : gray[400]
    }
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.mode === 'dark' ? gray[400] : 'inherit'
  },
  '& .MuiInputBase-input': {
    color: theme.palette.text.primary
  }
}));

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { setUser, refreshUserDetails } = useUser();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success',
  });

  const logoPath = theme.palette.mode === 'dark' 
    ? '/aurora-dark.png'
    : '/aurora-light.png';

  useEffect(() => {
    // Handle messages from SetPassword page
    if (location.state?.message) {
      setSnackbar({
        open: true,
        message: location.state.message,
        severity: 'success',
      });
      // Pre-fill email if provided
      if (location.state.email) {
        setFormData(prev => ({ ...prev, email: location.state.email }));
      }
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }

    // Handle URL error parameters
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    
    if (error) {
      let errorMessage = 'Authentication failed. Please try again.';
      let severity: 'error' | 'success' = 'error';
      
      // Map error types to specific messages
      if (error === 'email_exists') {
        errorMessage = 'This email is already registered with a different account type. Please use your original login method.';
      } else if (error === 'auth_failed') {
        errorMessage = 'Authentication failed. Please try again.';
      } else if (error === 'unauthorized') {
        errorMessage = 'You are not authorized to access this resource.';
      } else if (error === 'server_error') {
        errorMessage = 'A server error occurred. Please try again later.';
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: severity,
      });
      
      // Clear the URL parameter without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location, navigate]);

  const validateForm = () => {
    const newErrors: Partial<LoginFormData> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUser({
          _id: data.user._id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt
        });
        
        // Fetch complete user details
        await refreshUserDetails();
        setSnackbar({
          open: true,
          message: 'Login successful!',
          severity: 'success',
        });
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      } else {
        setSnackbar({
          open: true,
          message: data.message || 'Login failed',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred during login',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleGithubLogin = () => {
    window.location.href = '/auth/github';
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          pb: 4,
        }}
      >
        <StyledCard>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
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
                    width: '160px', 
                    height: 'auto',
                    display: 'block'
                  }} 
                />
              </Box>

              <Typography component="h1" variant="h5" fontWeight="bold">
                Welcome Back
              </Typography>
              <Typography color="textSecondary" variant="body2" sx={{ mt: 1 }}>
                Please sign in to continue
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <StyledTextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={!!errors.email}
                helperText={errors.email}
              />
              <StyledTextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                error={!!errors.password}
                helperText={errors.password}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  mb: 2,
                  borderRadius: '20px',
                  padding: '10px',
                  textTransform: 'none',
                  fontSize: '16px',
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Grid container justifyContent="space-between" sx={{ mb: 2 }}>
                <Grid item>
                  <Link href="/forgot-password" variant="body2" color="primary">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link href="/register" variant="body2" color="primary">
                    Create account
                  </Link>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }}>
                <Typography color="textSecondary" variant="body2">
                  OR
                </Typography>
              </Divider>

              <SocialButton
                startIcon={<GoogleIcon />}
                variant="outlined"
                color="primary"
                onClick={handleGoogleLogin}
              >
                Continue with Google
              </SocialButton>

              <SocialButton
                startIcon={<GitHubIcon />}
                variant="outlined"
                color="inherit"
                onClick={handleGithubLogin}
                sx={{ mt: 2 }}
              >
                Continue with GitHub
              </SocialButton>
            </Box>
          </CardContent>
        </StyledCard>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionProps={{ 
          timeout: 750 
        }}
        sx={{ 
          '& .MuiSnackbar-root': {
            transition: 'all 750ms ease-in-out'
          },
          '& .MuiAlert-root': {
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            fontSize: '1rem',
            animation: 'fadeInOut 750ms ease-in-out'
          },
          '@keyframes fadeInOut': {
            '0%': { opacity: 0, transform: 'translateY(-20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        <Alert 
          severity={snackbar.severity} 
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ 
            width: '100%',
            padding: '12px 16px'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login; 