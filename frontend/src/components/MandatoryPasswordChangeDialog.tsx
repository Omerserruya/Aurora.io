import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';

interface MandatoryPasswordChangeDialogProps {
  open: boolean;
  onPasswordChanged: () => void;
  onError: (error: string) => void;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function MandatoryPasswordChangeDialog({
  open,
  onPasswordChanged,
  onError
}: MandatoryPasswordChangeDialogProps) {
  const theme = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const logoPath = theme.palette.mode === 'dark' 
    ? '/aurora-dark.png'
    : '/aurora-light.png';

  const handlePasswordChange = async () => {
    const errors: FormErrors = {};
    
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (currentPassword === newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    setPasswordErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setIsChangingPassword(true);
      try {
        const response = await fetch('/api/users/reset-password', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword,
            newPassword
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            setPasswordErrors({
              currentPassword: 'Current password is incorrect'
            });
          } else {
            onError(errorData.message || 'Failed to update password. Please try again.');
          }
          return;
        }
        
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordErrors({});
        
        // Notify parent component
        onPasswordChanged();
      } catch (error: any) {
        onError('Failed to update password. Please try again.');
      } finally {
        setIsChangingPassword(false);
      }
    }
  };

  return (
    <Dialog 
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      // Prevent closing by clicking outside
      onClose={(event, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        gap: 2,
        pt: 3,
        pb: 1
      }}>
        {/* Aurora Logo */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          mb: 1
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
        
        {/* Title with Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockResetIcon color="primary" />
          <Typography variant="h6" component="span">
            Password Change Required
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            For security reasons, you must change your default password before continuing.
            This is a one-time requirement.
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={!!passwordErrors.currentPassword}
                helperText={passwordErrors.currentPassword}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={!!passwordErrors.newPassword}
                helperText={passwordErrors.newPassword || 'Must be at least 8 characters long'}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!passwordErrors.confirmPassword}
                helperText={passwordErrors.confirmPassword}
                required
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          onClick={handlePasswordChange}
          disabled={isChangingPassword}
          fullWidth
          size="large"
        >
          {isChangingPassword ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Updating Password...
            </>
          ) : (
            'Update Password'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 