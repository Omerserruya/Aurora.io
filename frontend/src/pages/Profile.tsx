import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Avatar, Stack, CircularProgress, Paper, Divider,
  TextField, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, PhotoCamera } from '@mui/icons-material';
import { useUser } from '../hooks/compatibilityHooks';
import api from '../utils/api';
import UserAvatar from '../components/UserAvatar';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  username: string;
  email: string;
  role?: string;
  createdAt?: string;
  avatarUrl?: string;
}

function Profile() {
  const { user: contextUser, refreshUserDetails, clearUser } = useUser();
  // Use type assertion to add avatarUrl property
  const user = contextUser as User;
  const [loading, setLoading] = useState(false);
  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  // Photo upload dialog
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // Add state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('error');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user?._id) {
      setUsername(user.username || '');
    }
  }, [user?._id]);

  // Handle profile edit
  const handleEditSave = async () => {
    if (isEditing && username.trim()) {
      try {
        await api.put(`/users/${user?._id}`, { username });
        // Refresh user data to update UI in real-time
        await refreshUserDetails();
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating username:', error);
      }
    } else {
      setIsEditing(true);
    }
  };

  // Handle avatar photo dialog
  const handlePhotoDialogOpen = () => {
    setPhotoDialogOpen(true);
  };

  const handlePhotoDialogClose = () => {
    setPhotoDialogOpen(false);
    setSelectedFile(null);
    setPhotoPreview(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check file size - 5MB limit
      if (file.size > 5000000) {
        // Show toast notification
        setToastMessage('Image too large! Maximum size is 5MB.');
        setToastSeverity('error');
        setToastOpen(true);
        
        // Reset the file input
        event.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotoPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    // Create form data for file upload
    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      await api.post(`/users/${user?._id}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh user data after avatar upload to update UI in real-time
      await refreshUserDetails();
      handlePhotoDialogClose();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      
      // Check for 413 error (Request Entity Too Large)
      if (error.response && error.response.status === 413) {
        setToastMessage('Image file size is too large for upload. Maximum size allowed is 5MB.');
        setToastSeverity('error');
        setToastOpen(true);
      } else {
        // Generic error message for other errors
        setToastMessage('Failed to upload image. Please try again.');
        setToastSeverity('error');
        setToastOpen(true);
      }
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const response = await api.delete(`/users/${user._id}`);
      
      if (response.status === 200) {
        // Log the user out after deleting account
        await fetch('/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        
        // Clear user context and redirect to home
        clearUser();
        navigate('/login');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      // You could add error handling/notification here
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // Toast close handler
  const handleToastClose = () => {
    setToastOpen(false);
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        Profile Details
      </Typography>

      <Paper elevation={3} sx={{ padding: 3, maxWidth: '600px', margin: '0', mb: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box position="relative">
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatarUrl}
                size={80}
                showUsername={false}
                userFromProps={true}
              />
              <IconButton
                size="small" 
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'white' 
                }}
                onClick={handlePhotoDialogOpen}
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
            </Box>
            
            {isEditing ? (
              <TextField
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                size="small"
                label="Username"
                fullWidth
                sx={{ flexGrow: 1 }}
              />
            ) : (
              <Typography variant="h5">{user.username}</Typography>
            )}
            
            <Button 
              startIcon={isEditing ? null : <EditIcon />} 
              onClick={handleEditSave}
              variant={isEditing ? "contained" : "outlined"}
            >
              {isEditing ? "Save" : "Edit"}
            </Button>
          </Stack>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Email
            </Typography>
            <Typography variant="h6" gutterBottom>
              {user.email}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Role
            </Typography>
            <Typography variant="h6" gutterBottom>
              {user.role || 'User'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Member Since
            </Typography>
            <Typography variant="h6">
              {new Date(user.createdAt || '').toLocaleDateString()}
            </Typography>
          </Box>

          {/* Add Delete Account button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                fontSize: '14px',
              }}
            >
              Delete Account
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onClose={handlePhotoDialogClose}>
        <DialogTitle>Change Profile Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
            {photoPreview ? (
              <Avatar 
                src={photoPreview} 
                sx={{ width: 150, height: 150, mb: 2 }}
              />
            ) : (
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatarUrl}
                size={150}
                showUsername={false}
                userFromProps={true}
              />
            )}
            
            <Button
              variant="contained"
              component="label"
              startIcon={<PhotoCamera />}
            >
              Select Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePhotoDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUploadPhoto} 
            variant="contained" 
            disabled={!selectedFile}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Make sure the Delete Account Confirmation Dialog is added if not already present */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteAccount} 
            variant="contained" 
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast notification */}
      <Toast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        onClose={handleToastClose}
      />
    </Box>
  );
}

export default Profile; 