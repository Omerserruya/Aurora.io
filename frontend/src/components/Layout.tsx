import React, { useState } from 'react';
import { Box, CircularProgress } from "@mui/material";
import { Outlet, Navigate } from 'react-router-dom';
import SideMenu from './SideMenuCustom/SideMenu';
import Header from './Header';
import { useUser } from '../hooks/compatibilityHooks';
import AIChatButton from './AIChatButton';
import { useAccount } from '../hooks/compatibilityHooks';

function Layout() {
  const { user, loading } = useUser();
  const { account } = useAccount();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(350);
  const [isDragging, setIsDragging] = useState(false);

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
        flexDirection: 'column'
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
            maxWidth: isChatOpen ? `calc(100% - ${chatWidth}px)` : '1100px',
            width: '100%',
            margin: '0',
            mt: 2,
            pl: 10,
            pr: 3,
            pb: 3,
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