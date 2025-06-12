import * as React from 'react';
import { Stack, Box, IconButton, Menu, MenuItem, Typography, Divider, useTheme, alpha } from '@mui/material';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import ColorModeIconDropdown from '../shared-theme/ColorModeIconDropdown';
import UserAvatar from './UserAvatar';
import { useUser } from '../hooks/compatibilityHooks';
import { useNavigate } from 'react-router-dom';
import { Person as PersonIcon, Logout as LogoutIcon } from '@mui/icons-material';

export default function Header() {
  const { user, clearUser } = useUser();
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    handleClose();
    clearUser();
    navigate('/');
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: 3,
        py: 0.75
      }}
    >
      <Stack
        direction="row"
        sx={{
          width: '100%',
          alignItems: 'center',
          position: 'relative',
        }}
        spacing={2}
      >
        <Box sx={{ position: 'absolute', left: 0 }}>
          <NavbarBreadcrumbs />
        </Box>
        <Box sx={{ 
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 40,
        }}>
         
        </Box>
        <Box sx={{ position: 'absolute', right: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ColorModeIconDropdown />
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ 
              ml: 2,
              border: '2px solid',
              borderColor: open ? 'primary.main' : 'transparent',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: alpha(theme.palette.primary.main, 0.08)
              }
            }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <UserAvatar
              username={user?.username}
              avatarUrl={user?.avatarUrl}
              size={32}
              showUsername={false}
            />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleClose}
            onClick={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                minWidth: 200,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            <Box sx={{ 
              px: 2, 
              py: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.08)
            }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                {user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem 
              onClick={handleProfile}
              sx={{ 
                py: 1.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08)
                }
              }}
            >
              <PersonIcon sx={{ mr: 2, fontSize: 20, color: 'primary.main' }} />
              Profile
            </MenuItem>
            <MenuItem 
              onClick={handleLogout}
              sx={{ 
                py: 1.5,
                color: 'error.main',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.08)
                }
              }}
            >
              <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Stack>
    </Box>
  );
}
