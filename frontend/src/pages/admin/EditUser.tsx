import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  FormHelperText,
  SelectChangeEvent,
  Divider,
  Breadcrumbs,
  Link,
  Autocomplete
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// User type definition
interface User {
  _id: string;
  email: string;
  role: string;
  authProvider: 'google' | 'github' | 'local';
  lastLogin: string;
  username: string;
}

interface FormErrors {
  email?: string;
  role?: string;
  username?: string;
}

export default function EditUser() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);

  const fetchUserById = async (id: string): Promise<User> => {
    const response = await fetch(`/api/users/${id}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return await response.json();
  };

  const createUser = async (userData: Partial<User>): Promise<User> => {
    const response = await fetch('/api/users/add', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return await response.json();
  };

  const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return await response.json();
  };

  const resetUserPassword = async (id: string): Promise<void> => {
    const response = await fetch(`/api/users/${id}/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to reset password');
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) {
        // Create mode - initialize empty user
        setUser({
          _id: '',
          username: '',
          email: '',
          role: 'user',
          authProvider: 'local',
          lastLogin: '',
        });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const userData = await fetchUserById(userId);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name && user) {
      setUser({
        ...user,
        [name]: value
      });
      
      // Clear error when field is edited
      if (errors[name as keyof FormErrors]) {
        setErrors({
          ...errors,
          [name]: undefined
        });
      }
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name && user) {
      setUser({
        ...user,
        [name]: value
      });
      
      // Clear error when field is edited
      if (errors[name as keyof FormErrors]) {
        setErrors({
          ...errors,
          [name]: undefined
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!user?.username?.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!user?.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!user?.role?.trim()) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      
      if (userId) {
        // Edit mode
        await updateUser(userId, user);
        setSaveSuccess(true);
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        // Create mode
        await createUser(user);
        setSaveSuccess(true);
        
        // Navigate back to users list after successful creation
        setTimeout(() => {
          navigate('/admin/users');
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      setSaveError(userId ? 'Failed to update user. Please try again.' : 'Failed to create user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userId) return;

    const confirmReset = window.confirm(
      'Are you sure you want to reset this user\'s password? They will receive an email with instructions to set a new password.'
    );

    if (!confirmReset) return;

    try {
      setResettingPassword(true);
      setPasswordResetError(null);
      setPasswordResetSuccess(false);

      await resetUserPassword(userId);
      setPasswordResetSuccess(true);

      // Reset success message after 5 seconds
      setTimeout(() => {
        setPasswordResetSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to reset password:', error);
      setPasswordResetError('Failed to reset password. Please try again.');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box>
        <Alert severity="error">User not found</Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/admin/users')}
          sx={{ mt: 2 }}
        >
          Back to Users
        </Button>
      </Box>
    );
  }

  const isCreateMode = !userId;

  return (
    <Box sx={{ width: '100%', mx: 'auto', px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isCreateMode ? 'Create New User' : `Edit User: ${user.username}`}
      </Typography>
      
      {/* Alerts Section */}
      <Box sx={{ mb: 4 }}>
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {isCreateMode ? 'User created successfully!' : 'User updated successfully!'}
          </Alert>
        )}
        
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}
        
        {passwordResetSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password reset email has been sent to the user.
          </Alert>
        )}
        
        {passwordResetError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {passwordResetError}
          </Alert>
        )}
      </Box>
      
      {/* User Information Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" component="h2" fontWeight="500" gutterBottom>
          User Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={user.username}
                onChange={handleInputChange}
                error={!!errors.username}
                helperText={errors.username}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={user.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={user.role}
                  label="Role"
                  onChange={handleSelectChange}
                  required
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/admin/users')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit" 
                  variant="contained" 
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                  {saving ? (isCreateMode ? 'Creating...' : 'Saving...') : (isCreateMode ? 'Create User' : 'Save Changes')}
                </Button>
              </Box>
            </Grid>
          </Grid>

        </form>
      </Box>
      
      {/* Security Section - only show for edit mode */}
      {!isCreateMode && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" fontWeight="500" gutterBottom>
            Security Options
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LockResetIcon />}
              onClick={handleResetPassword}
              disabled={resettingPassword}
            >
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Typography variant="body2" color="text.secondary">
              This will send an email to the user with instructions to reset their password.
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Additional Section - Activity Information - only show for edit mode */}
      {!isCreateMode && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" fontWeight="500" gutterBottom>
            Activity Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Last Login
              </Typography>
              <Typography variant="body1">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Auth Provider
              </Typography>
              <Typography variant="body1" sx={{
                color: user.authProvider === 'local' ? 'success.main' : 
                       user.authProvider === 'google' ? 'error.main' : 'info.main'
              }}>
                {user.authProvider ? user.authProvider.charAt(0).toUpperCase() + user.authProvider.slice(1) : 'Unknown'}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
} 