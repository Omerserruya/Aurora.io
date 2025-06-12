import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  useTheme,
  Container,
  Fab,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled, keyframes } from '@mui/material/styles';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

// Keyframe animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(2deg); }
  50% { transform: translateY(-10px) rotate(-1deg); }
  75% { transform: translateY(-15px) rotate(1deg); }
`;

const flashlight = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.8; transform: scale(1.2) rotate(180deg); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1); }
`;

const slideUp = keyframes`
  0% { transform: translateY(100px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const GradientBackground = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(135deg, #2D1B69 0%, #1A3B69 50%, #0F1B27 100%)',
  zIndex: -2,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
    opacity: '0.1',
    animation: 'moveBackground 30s linear infinite',
  },
  '@keyframes moveBackground': {
    '0%': {
      transform: 'translateY(0)',
    },
    '100%': {
      transform: 'translateY(-100%)',
    },
  },
});

const HeaderBox = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  padding: '25px 50px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 100,
  background: 'transparent',
  transition: 'all 0.3s ease-in-out',
});

const AuthButtons = styled(Box)({
  display: 'flex',
  gap: '20px',
});

const StyledButton = styled(Button)({
  borderRadius: '30px',
  padding: '12px 32px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1.1rem',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
});

const LoginButton = styled(StyledButton)({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(15px)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
  },
});

const RegisterButton = styled(StyledButton)({
  backgroundColor: 'rgba(99, 149, 255, 0.2)',
  color: 'white',
  border: '1px solid rgba(99, 149, 255, 0.5)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 16px rgba(99, 149, 255, 0.1)',
  '&:hover': {
    backgroundColor: 'rgba(99, 149, 255, 0.3)',
    borderColor: 'rgba(99, 149, 255, 0.7)',
    backdropFilter: 'blur(15px)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(99, 149, 255, 0.2), 0 0 0 1px rgba(99, 149, 255, 0.3)',
  },
});

const MainContent = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  color: 'white',
  zIndex: 1,
  maxWidth: '800px',
  width: '100%',
  padding: '0 20px',
  paddingTop: '100px', // Account for fixed header
});

const AuroraLogo = styled('img')({
  height: '80px',
  width: 'auto',
});

const PageContainer = styled('div')({
  height: '200vh', // Make page scrollable
  position: 'relative',
});

const SecondSection = styled('div')({
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
});

const CloudContainer = styled(Box)({
  position: 'absolute',
  bottom: '10%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  height: '300px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '60px',
  zIndex: 1,
});

const CloudIcon = styled('div')<{ delay?: number; color?: string }>(({ delay = 0, color = '#6395FF' }) => ({
  width: '80px',
  height: '60px',
  background: `linear-gradient(135deg, ${color} 0%, rgba(255,255,255,0.3) 100%)`,
  borderRadius: '50px',
  position: 'relative',
  animation: `${float} 4s ease-in-out infinite`,
  animationDelay: `${delay}s`,
  boxShadow: `0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-20px',
    left: '20px',
    width: '40px',
    height: '40px',
    background: `linear-gradient(135deg, ${color} 0%, rgba(255,255,255,0.4) 100%)`,
    borderRadius: '50%',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-10px',
    right: '15px',
    width: '30px',
    height: '30px',
    background: `linear-gradient(135deg, ${color} 0%, rgba(255,255,255,0.4) 100%)`,
    borderRadius: '50%',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
  },
}));

const FlashLight = styled('div')({
  position: 'absolute',
  bottom: '-50px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '500px',
  height: '200px',
  background: 'linear-gradient(to top, rgba(255,255,255,0.1) 0%, transparent 70%)',
  clipPath: 'polygon(40% 100%, 60% 100%, 80% 0%, 20% 0%)',
  animation: `${flashlight} 3s ease-in-out infinite`,
  zIndex: 0,
});

const Sparkle = styled('div')<{ top?: string; left?: string; delay?: number }>(({ top = '20%', left = '30%', delay = 0 }) => ({
  position: 'absolute',
  top,
  left,
  width: '4px',
  height: '4px',
  background: 'white',
  borderRadius: '50%',
  animation: `${sparkle} 2s ease-in-out infinite`,
  animationDelay: `${delay}s`,
  boxShadow: '0 0 10px white',
}));

const ScrollToTopButton = styled(Fab)<{ show: boolean }>(({ show }) => ({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 1000,
  background: 'rgba(99, 149, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(99, 149, 255, 0.3)',
  color: 'white',
  opacity: show ? 1 : 0,
  visibility: show ? 'visible' : 'hidden',
  transform: show ? 'translateY(0)' : 'translateY(20px)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: 'rgba(99, 149, 255, 0.3)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(99, 149, 255, 0.3)',
  },
}));

const StickyHeader = styled(Box)<{ visible: boolean }>(({ visible }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  padding: '25px 50px',
  background: 'rgba(45, 27, 105, 0.9)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 100,
  transform: visible ? 'translateY(0)' : 'translateY(-100%)',
  transition: 'transform 0.3s ease-in-out',
}));

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(99, 149, 255, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(99, 149, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(99, 149, 255, 0); }
`;

const ExploreButton = styled(Button)({
  background: 'linear-gradient(45deg, rgba(99, 149, 255, 0.2), rgba(156, 39, 176, 0.2))',
  border: '2px solid rgba(99, 149, 255, 0.4)',
  borderRadius: '50px',
  padding: '20px 50px',
  color: 'white',
  fontSize: '1.4rem',
  fontWeight: 600,
  textTransform: 'none',
  backdropFilter: 'blur(15px)',
  position: 'relative',
  overflow: 'hidden',
  animation: `${pulse} 2s infinite`,
  transition: 'all 0.2s ease-out',
  transformStyle: 'preserve-3d',
  perspective: '1000px',
  minWidth: '240px',
  minHeight: '60px',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.5s',
    zIndex: 1,
  },
  '&:hover': {
    borderColor: 'rgba(99, 149, 255, 0.7)',
    background: 'linear-gradient(45deg, rgba(99, 149, 255, 0.3), rgba(156, 39, 176, 0.3))',
    animation: 'none', // Stop pulse on hover
    '&::before': {
      left: '100%',
    },
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
});

const Landing = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [hasTriggeredAutoScroll, setHasTriggeredAutoScroll] = useState(false);
  const [buttonTransform, setButtonTransform] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const logoPath = theme.palette.mode === 'dark' 
    ? '/aurora-dark.png'
    : '/aurora-light.png';

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const showButton = scrollTop > windowHeight * 0.5;
      
      setShowScrollTop(showButton);

      // Auto scroll to bottom when user starts scrolling down (but not if already auto-scrolling)
      if (!isAutoScrolling && !hasTriggeredAutoScroll && scrollTop > 50 && scrollTop < windowHeight * 0.2) {
        setIsAutoScrolling(true);
        setHasTriggeredAutoScroll(true);
        
        // Slow, smooth scroll to bottom with custom animation
        const startTime = performance.now();
        const startPosition = scrollTop;
        const targetPosition = documentHeight - windowHeight;
        const distance = targetPosition - startPosition;
        const duration = 3000; // 3 seconds for slow scroll
        
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function for smooth deceleration
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const currentPosition = startPosition + (distance * easeOutCubic);
          
          window.scrollTo(0, currentPosition);
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          } else {
            setIsAutoScrolling(false);
          }
        };
        
        requestAnimationFrame(animateScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAutoScrolling, hasTriggeredAutoScroll]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const scrollToTop = () => {
    setIsAutoScrolling(true); // Prevent auto-scroll during manual scroll
    setHasTriggeredAutoScroll(true); // Keep it triggered to prevent auto-scroll
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Reset after scroll completes and allow auto-scroll again if user scrolls manually
    setTimeout(() => {
      setIsAutoScrolling(false);
      setHasTriggeredAutoScroll(false);
    }, 1000);
  };

  const scrollToSecondSection = () => {
    const windowHeight = window.innerHeight;
    window.scrollTo({
      top: windowHeight,
      behavior: 'smooth'
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current || !buttonContainerRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const containerRect = buttonContainerRef.current.getBoundingClientRect();
    
    const centerX = buttonRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top + buttonRect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Use container size for smoother tracking over larger area
    const effectiveWidth = containerRect.width;
    const effectiveHeight = containerRect.height;
    
    const rotateX = (mouseY / effectiveHeight) * -15; // Reduced intensity for smoother feel
    const rotateY = (mouseX / effectiveWidth) * 15;
    
    const shadowX = (mouseX / effectiveWidth) * 15;
    const shadowY = (mouseY / effectiveHeight) * 15;
    
    setButtonTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px) scale(1.05)`
    );
    
    // Update box shadow to follow mouse
    if (buttonRef.current) {
      buttonRef.current.style.boxShadow = `
        ${shadowX}px ${shadowY + 10}px 30px rgba(99, 149, 255, 0.4),
        ${shadowX * 0.5}px ${shadowY * 0.5 + 5}px 15px rgba(156, 39, 176, 0.3),
        0 0 0 1px rgba(255,255,255,0.1)
      `;
    }
  };

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      buttonRef.current.style.transition = 'all 0.1s ease-out';
    }
  };

  const handleMouseLeave = () => {
    setButtonTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)');
    if (buttonRef.current) {
      buttonRef.current.style.transition = 'all 0.3s ease-out';
      buttonRef.current.style.boxShadow = '0 10px 30px rgba(99, 149, 255, 0.3), 0 0 0 1px rgba(255,255,255,0.1)';
    }
  };

  return (
    <PageContainer>
      <GradientBackground />
      
      {/* Fixed Header */}
      <HeaderBox>
        <AuroraLogo src={logoPath} alt="Aurora Logo" />
        
        <AuthButtons>
          <LoginButton onClick={handleLogin}>
            Login
          </LoginButton>
          <RegisterButton onClick={handleRegister}>
            Register
          </RegisterButton>
        </AuthButtons>
      </HeaderBox>

      {/* First Section - Main Landing */}
      <Box sx={{ height: '100vh', position: 'relative', paddingTop: '120px' }}>

        {/* Main Content */}
        <MainContent>
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5.5rem' },
              fontWeight: 'bold',
              textShadow: '0 4px 8px rgba(0,0,0,0.4)',
              lineHeight: 1.3,
              maxWidth: '1200px',
              margin: '0 auto',
              marginBottom: 4,
              textAlign: 'center',
              width: '100%',
            }}
          >
            <Box component="div" sx={{ 
              marginBottom: 2, 
              whiteSpace: 'nowrap',
              textAlign: 'center',
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}>
              It's like giving your cloud
            </Box>
            <Box component="div" sx={{ 
              textAlign: 'center',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 0
            }}>
              <span>a&nbsp;</span>
              <Box component="span" sx={{ fontWeight: 'bold', fontStyle: 'italic', color: '#9C27B0' }}>
                brain
              </Box>
              <span>&nbsp;and a&nbsp;</span>
              <Box component="span" sx={{ fontWeight: 'bold', fontStyle: 'italic', color: '#6395FF' }}>
                map
              </Box>
            </Box>
          </Typography>
          
          <Box sx={{ marginTop: 6, display: 'flex', justifyContent: 'center' }}>
            <Box
              ref={buttonContainerRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              sx={{
                padding: '40px', // Expanded interaction area
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <ExploreButton 
                ref={buttonRef}
                onClick={scrollToSecondSection}
                sx={{
                  transform: buttonTransform || 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)',
                  boxShadow: '0 10px 30px rgba(99, 149, 255, 0.3), 0 0 0 1px rgba(255,255,255,0.1)',
                  pointerEvents: 'all',
                }}
              >
                Explore Aurora.io
              </ExploreButton>
            </Box>
          </Box>
        </MainContent>


      </Box>

      {/* Second Section - Placeholder for future content */}
      <SecondSection>
        <Typography variant="h3" sx={{ color: 'white', textAlign: 'center' }}>
          More content coming soon...
        </Typography>
      </SecondSection>

      {/* Scroll to Top Button */}
      <ScrollToTopButton show={showScrollTop} onClick={scrollToTop}>
        <KeyboardArrowUpIcon />
      </ScrollToTopButton>
    </PageContainer>
  );
};

export default Landing; 