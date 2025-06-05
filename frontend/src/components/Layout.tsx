import React, { useState } from 'react';
import { Box, CircularProgress, Alert, useMediaQuery, useTheme, Typography, Paper, alpha } from "@mui/material";
import { Outlet, Navigate } from 'react-router-dom';
import SideMenu from './SideMenuCustom/SideMenu';
import Header from './Header';
import { useUser } from '../hooks/compatibilityHooks';
import AIChatButton from './AIChatButton';
import { useAccount } from '../hooks/compatibilityHooks';
import ComputerIcon from '@mui/icons-material/Computer';
import CloudIcon from '@mui/icons-material/Cloud';

function Layout() {
  const { user, loading } = useUser();
  const { account } = useAccount();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(350);
  const [isDragging, setIsDragging] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = chatWidth;

    const handleDrag = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      const newWidth = Math.min(Math.max(startWidth + deltaX, 250), 700);
      setChatWidth(newWidth);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  };

  // Show loading state while checking user authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show mobile warning screen
  if (isMobile) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'flex-start',
        p: 3,
        textAlign: 'center',
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
        backdropFilter: 'blur(10px)',
        overflowY: 'auto'
      }}>
        {/* Aurora Logo */}
        <Box sx={{ 
          mt: 4,
          mb: 3,
          flexShrink: 0
        }}>
          <img 
            src={theme.palette.mode === 'dark' ? '/aurora-dark.png' : '/aurora-light.png'}
            alt="Aurora Logo" 
            style={{ 
              width: '180px', 
              height: 'auto',
              display: 'block'
            }} 
          />
        </Box>

        {/* Main Content */}
        <Paper 
          elevation={0}
          sx={{ 
            maxWidth: 400,
            width: '100%',
            p: 3,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2,
            mb: 2,
            flexShrink: 0
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ 
            fontWeight: 600, 
            color: theme.palette.text.primary
          }}>
            Welcome to Aurora
          </Typography>
          <Typography variant="body1" sx={{ 
            mb: 2,
            color: theme.palette.text.secondary
          }}>
            Aurora is a powerful cloud management platform designed to help you optimize and manage your cloud infrastructure. Our desktop application provides advanced features and a seamless experience for managing your cloud resources.
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.text.secondary
          }}>
            For the best experience, please access Aurora from your desktop computer.
          </Typography>
        </Paper>

        {/* Additional Info */}
        <Paper 
          elevation={0}
          sx={{ 
            maxWidth: 400,
            width: '100%',
            p: 2,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.warning.dark, 0.15)} 0%, ${alpha(theme.palette.warning.main, 0.15)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.15)} 0%, ${alpha(theme.palette.warning.main, 0.15)} 100%)`,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            borderRadius: 1,
            mb: 4,
            flexShrink: 0
          }}
        >
          <Typography variant="body2" sx={{ 
            color: theme.palette.warning.main,
            fontWeight: 500 
          }}>
            Mobile access is not available at this time
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <SideMenu />
      
      {/* Main content */}
      <Box sx={{ 
        flexGrow: 1, 
        marginLeft: { xs: 0, md: 0 },
        width: { xs: '100%', md: 'calc(100% - 360px)' },
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        pt: isMobile ? 7 : 0 // Add padding top when mobile warning is shown
      }}>
        {/* Header */}
        <Header />
        
        {/* Content and Chat Container */}
        <Box sx={{ 
          display: 'flex',
          flexGrow: 1,
          position: 'relative'
        }}>
          {/* Page Content */}
          <Box sx={{ 
            flexGrow: 1,
            maxWidth: isChatOpen ? `calc(100% - ${chatWidth}px)` : '100%',
            width: '100%',
            margin: '0',

            transition: isDragging ? 'none' : 'max-width 0.3s ease-in-out'
          }}>
            <Outlet />
          </Box>

          {/* Chat Panel */}
          <Box sx={{
            width: isChatOpen ? `${chatWidth}px` : 0,
            height: 'calc(100vh - 50px)', // Full height minus header
            position: 'fixed',
            right: 0,
            top: 35, // Start below header
            transition: isDragging ? 'none' : 'width 0.3s ease-in-out',
            overflow: 'hidden',
            borderLeft: isChatOpen ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
            mt: 2
          }}>
            {/* Drag Handle */}
            {isChatOpen && (
              <Box
                onMouseDown={handleDragStart}
                sx={{
                  mt: 2,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '8px',
                  cursor: 'col-resize',
                  backgroundColor: isDragging ? 'primary.main' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    opacity: 0.5,
                  },
                  '&:active': {
                    backgroundColor: 'primary.dark',
                  },
                  zIndex: 1,
                  userSelect: 'none',
                  touchAction: 'none',
                }}
              />
            )}
            <AIChatButton isInline={true} isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
          </Box>          
        </Box>
      </Box>

      {/* Floating Chat Button - Only show when account is selected and chat is closed */}
      {account && !isChatOpen && (
        <AIChatButton isInline={false} isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
      )}
    </Box>
  );
}

export default Layout; 