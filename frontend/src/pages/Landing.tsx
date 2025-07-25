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

const fadeInLeft = keyframes`
  0% { transform: translateX(-100px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const fadeInRight = keyframes`
  0% { transform: translateX(100px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const fadeInUp = keyframes`
  0% { transform: translateY(50px); opacity: 0; }
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
  '@media (max-width: 768px)': {
    padding: '15px 20px',
  },
});

const AuthButtons = styled(Box)({
  display: 'flex',
  gap: '20px',
  '@media (max-width: 768px)': {
    gap: '10px',
  },
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
  '@media (max-width: 768px)': {
    padding: '10px 20px',
    fontSize: '0.95rem',
  },
  '@media (max-width: 480px)': {
    padding: '8px 16px',
    fontSize: '0.9rem',
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
  '@media (max-width: 768px)': {
    padding: '0 15px',
    paddingTop: '80px',
    maxWidth: '90%',
  },
  '@media (max-width: 480px)': {
    padding: '0 10px',
    paddingTop: '60px',
    maxWidth: '95%',
  },
});

const AuroraLogo = styled('img')({
  height: '80px',
  width: 'auto',
  '@media (max-width: 768px)': {
    height: '60px',
  },
  '@media (max-width: 480px)': {
    height: '50px',
  },
});

const PageContainer = styled('div')({
  height: '200vh', // Make page scrollable
  position: 'relative',
});

const SecondSection = styled('div')({
  minHeight: '150vh',
  padding: '100px 40px',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  '@media (max-width: 768px)': {
    padding: '80px 20px',
    minHeight: 'auto',
    paddingTop: '60px', // Reduce top padding to bring content into view sooner
  },
  '@media (max-width: 480px)': {
    padding: '60px 15px',
    paddingTop: '40px', // Even less padding on very small screens
  },
  '@media (max-height: 600px)': {
    // Special handling for devices with very small height
    minHeight: 'auto',
    paddingTop: '40px',
    paddingBottom: '40px',
  },
});

const FeatureShowcase = styled('div')({
  maxWidth: '1400px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '120px',
  '@media (max-width: 768px)': {
    gap: '80px',
  },
  '@media (max-width: 480px)': {
    gap: '60px',
  },
});

const FeatureSection = styled('div')<{ 
  visible: boolean; 
  reverse?: boolean;
  delay?: number;
}>(({ visible, reverse = false, delay = 0 }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '80px',
  flexDirection: reverse ? 'row-reverse' : 'row',
  opacity: visible ? 1 : 0,
  animation: visible 
    ? `${fadeInUp} 0.8s ease-out ${delay}s forwards`
    : 'none',
  transition: 'opacity 0.3s ease-out',
  '@media (max-width: 1024px)': {
    flexDirection: 'column',
    gap: '40px',
    textAlign: 'center',
  },
  '@media (max-width: 768px)': {
    flexDirection: 'column',
    gap: '30px',
    textAlign: 'center',
    // Ensure content is visible on mobile even if intersection observer fails
    opacity: 1,
    animation: `${fadeInUp} 0.6s ease-out ${delay}s forwards`,
  },
  '@media (max-width: 480px)': {
    flexDirection: 'column',
    gap: '20px',
    textAlign: 'center',
    // Ensure content is visible on mobile even if intersection observer fails
    opacity: 1,
    animation: `${fadeInUp} 0.6s ease-out ${delay}s forwards`,
  },
}));

const FeatureContent = styled('div')({
  flex: 1,
  maxWidth: '500px',
  '@media (max-width: 768px)': {
    maxWidth: '100%',
  },
});

const FeatureImageContainer = styled('div')({
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const FeatureImage = styled('img')({
  width: '750px',
  maxWidth: '100%',
  height: 'auto',
  borderRadius: '20px',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
  border: '3px solid rgba(255, 255, 255, 0.1)',
  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform, box-shadow',
  '&:hover': {
    transform: 'scale(1.03) translateY(-5px)',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)',
  },
});

const FeatureTitle = styled('h3')({
  color: 'white',
  fontSize: '2.5rem',
  fontWeight: 'bold',
  marginBottom: '20px',
  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  '@media (max-width: 768px)': {
    fontSize: '2rem',
    marginBottom: '15px',
  },
  '@media (max-width: 480px)': {
    fontSize: '1.75rem',
    marginBottom: '12px',
  },
});

const FeatureDescription = styled('p')({
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '1.2rem',
  lineHeight: 1.6,
  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  marginBottom: '0',
  '@media (max-width: 768px)': {
    fontSize: '1.1rem',
    lineHeight: 1.5,
  },
  '@media (max-width: 480px)': {
    fontSize: '1rem',
    lineHeight: 1.4,
  },
});

const SectionTitle = styled('h2')({
  color: 'white',
  fontSize: '3.5rem',
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: '60px',
  textShadow: '0 4px 8px rgba(0,0,0,0.5)',
  opacity: 0,
  animation: `${fadeInUp} 0.8s ease-out 0.2s forwards`,
  '@media (max-width: 768px)': {
    fontSize: '2.5rem',
    marginBottom: '40px',
    // Ensure title is visible on mobile
    opacity: 1,
    animation: `${fadeInUp} 0.6s ease-out 0.1s forwards`,
  },
  '@media (max-width: 480px)': {
    fontSize: '2rem',
    marginBottom: '30px',
    // Ensure title is visible on mobile
    opacity: 1,
    animation: `${fadeInUp} 0.6s ease-out 0.1s forwards`,
  },
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

const ScrollToTopButton = styled(Fab)<{ $show: boolean }>(({ $show }) => ({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 1000,
  background: 'rgba(99, 149, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(99, 149, 255, 0.3)',
  color: 'white',
  opacity: $show ? 1 : 0,
  visibility: $show ? 'visible' : 'hidden',
  transform: $show ? 'translateY(0)' : 'translateY(20px)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: 'rgba(99, 149, 255, 0.3)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(99, 149, 255, 0.3)',
  },
  '@media (max-width: 768px)': {
    bottom: '15px',
    right: '15px',
    width: '48px',
    height: '48px',
  },
  '@media (max-width: 480px)': {
    bottom: '12px',
    right: '12px',
    width: '44px',
    height: '44px',
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
  '@media (max-width: 768px)': {
    padding: '16px 40px',
    fontSize: '1.2rem',
    minWidth: '200px',
    minHeight: '55px',
  },
  '@media (max-width: 480px)': {
    padding: '14px 30px',
    fontSize: '1.1rem',
    minWidth: '180px',
    minHeight: '50px',
  },
});

const Landing = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [buttonTransform, setButtonTransform] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const logoPath = '/aurora-dark.png';

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const showButton = scrollTop > windowHeight * 0.5;
      
      setShowScrollTop(showButton);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for features section with mobile-friendly settings
  useEffect(() => {
    // Check if user is on mobile/small screen
    const isMobile = window.innerWidth <= 768;
    const isSmallHeight = window.innerHeight <= 600;
    
    // Set fallback timeout for mobile devices or small screens
    const fallbackTimeout = setTimeout(() => {
      if (!featuresVisible && (isMobile || isSmallHeight)) {
        setFeaturesVisible(true);
      }
    }, 1000); // Show features after 1 second if intersection observer fails

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFeaturesVisible(true);
            clearTimeout(fallbackTimeout);
          }
        });
      },
      {
        // Use more mobile-friendly threshold
        threshold: isMobile ? 0.1 : 0.3, // Lower threshold for mobile devices
        // Adjust root margin based on screen size
        rootMargin: isMobile ? '0px 0px -20px 0px' : '0px 0px -100px 0px',
      }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      clearTimeout(fallbackTimeout);
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, [featuresVisible]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToSecondSection = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Disable 3D effects on mobile/touch devices
    if (!buttonRef.current || !buttonContainerRef.current || window.innerWidth <= 768) return;

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
              whiteSpace: { xs: 'normal', md: 'nowrap' },
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
              gap: 0,
              flexWrap: { xs: 'wrap', sm: 'nowrap' }
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
                padding: { xs: '20px', md: '40px' }, // Smaller interaction area on mobile
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

      {/* Second Section - Features Showcase */}
      <SecondSection ref={featuresRef}>
        <SectionTitle>
          Powerful Features at Your Fingertips
        </SectionTitle>
        
        <FeatureShowcase>
          <FeatureSection 
            visible={featuresVisible} 
            delay={0.2}
          >
            <FeatureContent>
              <FeatureTitle>Full Visibility</FeatureTitle>
              <FeatureDescription>
                Gain complete visibility into your cloud infrastructure with our comprehensive visualization tools. 
                Map your entire cloud ecosystem, track resource relationships, and maintain a clear overview 
                of your infrastructure at all times.
              </FeatureDescription>
            </FeatureContent>
            <FeatureImageContainer>
              <FeatureImage
                src="/landing-screenshots/visualization-ai-screenshot.png"
                alt="Aurora Full Visibility"
              />
            </FeatureImageContainer>
          </FeatureSection>

          <FeatureSection 
            visible={featuresVisible} 
            reverse={true}
            delay={0.4}
          >
            <FeatureContent>
              <FeatureTitle>AI-Powered Top Issues</FeatureTitle>
              <FeatureDescription>
                Get comprehensive insights into your cloud infrastructure with real-time monitoring, 
                cost analysis, and performance metrics. Track resource usage, identify optimization 
                opportunities, and make data-driven decisions.
              </FeatureDescription>
            </FeatureContent>
            <FeatureImageContainer>
              <FeatureImage
                src="/landing-screenshots/home-stats-screenshot.png"
                alt="Aurora Analytics Dashboard"
              />
            </FeatureImageContainer>
          </FeatureSection>

          <FeatureSection 
            visible={featuresVisible} 
            delay={0.6}
          >
            <FeatureContent>
              <FeatureTitle>AI-Driven Architect</FeatureTitle>
              <FeatureDescription>
                Aurora.io doesn't just visualize your cloud — it understands it. Our AI continuously analyzes your 
                architecture to detect misconfigurations, identify design flaws, and highlight critical paths. 
                It's like having a cloud architect baked into your infrastructure, guiding you toward smarter, 
                safer, and more scalable decisions — in real time.
              </FeatureDescription>
            </FeatureContent>
            <FeatureImageContainer>
              <FeatureImage
                src="/landing-screenshots/AI-Architect.png"
                alt="Aurora AI-Driven Architecture"
              />
            </FeatureImageContainer>
          </FeatureSection>

          <FeatureSection 
            visible={featuresVisible} 
            reverse={true}
            delay={0.8}
          >
            <FeatureContent>
              <FeatureTitle>Infrastructure as Code</FeatureTitle>
              <FeatureDescription>
                Transform your cloud management with intelligent Infrastructure as Code generation. 
                Aurora automatically creates and maintains your IaC templates, ensuring consistency, 
                version control, and best practices across your entire infrastructure.
              </FeatureDescription>
            </FeatureContent>
            <FeatureImageContainer>
              <FeatureImage
                src="/landing-screenshots/iac-screenshot.png"
                alt="Aurora Infrastructure as Code"
              />
            </FeatureImageContainer>
          </FeatureSection>
        </FeatureShowcase>
      </SecondSection>

      {/* Contact/Partnership Section */}
      <Box
        sx={{
          minHeight: '60vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: '30px 20px', md: '50px 40px' },
          background: 'transparent',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              textAlign: 'center',
              color: 'white',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2.2rem', md: '3rem' },
                fontWeight: 'bold',
                marginBottom: 2,
                textShadow: '0 4px 8px rgba(0,0,0,0.4)',
                animation: `${fadeInUp} 0.8s ease-out forwards`,
              }}
            >
              Let's Shape the Future of Cloud Together
            </Typography>
            
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.2rem' },
                lineHeight: 1.6,
                marginBottom: 3,
                color: 'rgba(255, 255, 255, 0.9)',
                animation: `${fadeInUp} 0.8s ease-out 0.2s forwards`,
                opacity: 0,
              }}
            >
              We're building Aurora.io alongside cloud architects, security leaders, and early believers.
              If you're an investor, a design partner, or just excited about what we're doing — we'd love to connect.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                animation: `${fadeInUp} 0.8s ease-out 0.4s forwards`,
                opacity: 0,
              }}
            >
              <Button
                variant="contained"
                sx={{
                  background: 'linear-gradient(45deg, rgba(99, 149, 255, 0.3), rgba(156, 39, 176, 0.3))',
                  color: 'white',
                  border: '2px solid rgba(99, 149, 255, 0.5)',
                  padding: '16px 48px',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  borderRadius: '50px',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease-out',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.5s',
                  },
                  '&:hover': {
                    transform: 'translateY(-3px) scale(1.05)',
                    boxShadow: '0 12px 30px rgba(99, 149, 255, 0.4)',
                    borderColor: 'rgba(99, 149, 255, 0.8)',
                    '&::before': {
                      left: '100%',
                    },
                  },
                  '&:active': {
                    transform: 'translateY(-1px) scale(0.98)',
                  },
                }}
                onClick={() => window.location.href = 'mailto:auroraioapp@gmail.com'}
              >
                Contact Us
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Scroll to Top Button */}
      <ScrollToTopButton $show={showScrollTop} onClick={scrollToTop}>
        <KeyboardArrowUpIcon />
      </ScrollToTopButton>
    </PageContainer>
  );
};

export default Landing; 