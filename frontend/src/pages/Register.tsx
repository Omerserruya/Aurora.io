import React, { useState } from 'react';
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
  IconButton,
  Divider,
  Card,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { StyledBackground, SocialButton } from '../styles/AuthStyles';
import { styled, Theme } from '@mui/material/styles';

const PASSWORD_MIN_LENGTH = 8;

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
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

const Register = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success',
  });

  const logoPath = theme.palette.mode === 'dark' 
    ? '/aurora-dark.png'
    : '/aurora-light.png';

  const validateForm = () => {
    const newErrors: Partial<RegisterFormData> = {};
    if (!formData.username) {
      newErrors.username = 'Username is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      setSnackbar({
        open: true,
        message: 'Registration successful! Redirecting to login...',
        severity: 'success',
      });

      // Wait a bit for the success message to be visible before redirecting
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Registration failed. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
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
                Create Account
              </Typography>
              <Typography color="textSecondary" variant="body2" sx={{ mt: 1 }}>
                Sign up to get started
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    error={!!errors.username}
                    helperText={errors.username}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    error={!!errors.password}
                    helperText={errors.password}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  borderRadius: '20px',
                  padding: '10px',
                  textTransform: 'none',
                  fontSize: '16px',
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>

              <Grid container justifyContent="center">
                <Grid item>
                  <Link href="/login" variant="body2" color="primary">
                    Already have an account? Sign in
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
                onClick={() => window.location.href = '/auth/google'}
              >
                Continue with Google
              </SocialButton>

              <SocialButton
                startIcon={<GitHubIcon />}
                variant="outlined"
                color="primary"
                onClick={() => window.location.href = '/auth/github'}
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

export default Register; 