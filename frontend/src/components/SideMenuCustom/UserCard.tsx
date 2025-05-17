import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useUser } from '../../hooks/compatibilityHooks';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../UserAvatar';

export default function UserCard() {
  const { user, clearUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <UserAvatar
          username={user?.username}
          avatarUrl={user?.avatarUrl}
          size={32}
          showUsername={false}
        />
        <Box>
          <Typography variant="subtitle2" noWrap>
            {user?.username}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user?.email}
          </Typography>
        </Box>
      </Box>
      <IconButton
        onClick={handleLogout}
        size="small"
        sx={{
          color: 'text.secondary',
          '&:hover': {
            color: 'error.main',
            backgroundColor: 'error.lighter',
          },
        }}
      >
        <LogoutIcon />
      </IconButton>
    </Box>
  );
}