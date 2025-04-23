import React, { useState, useEffect } from 'react';
import { Box, IconButton, Paper, TextField, Typography, useTheme, Fade, Slide, Tooltip, Button as MuiButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import { mcpService } from '../api/mcpService';
import { useUser } from '../contexts/UserContext';
import { useAccount } from '../contexts/AccountContext';
import { LoadingOutlined } from '@ant-design/icons';
import { message } from 'antd';

const FloatingButton = styled(MuiButton)(({ theme }) => ({
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  height: '60px',
  padding: '0 24px',
  color: '#ffffff',
  fontWeight: 'bold',
  borderRadius: '30px',
  background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
  boxShadow: '0 4px 20px rgba(106, 17, 203, 0.4)',
  zIndex: 1000,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 7px 25px rgba(106, 17, 203, 0.5)',
    background: 'linear-gradient(45deg, #6a11cb 30%, #2575fc 90%)',
  },
  '& .MuiButton-startIcon': {
    marginRight: '10px',
  },
}));

const ChatContainer = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: '105px',
  right: '30px',
  width: 'calc(100vw * 4/9)',
  maxWidth: '800px',
  minWidth: '450px',
  height: '85vh',
  maxHeight: '1000px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  zIndex: 1000,
  borderRadius: '18px',
  overflow: 'hidden',
  background: '#ffffff',
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ChatMessages = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(3),
  backgroundColor: '#f9f9f9',
}));

const ChatInput = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  backgroundColor: '#ffffff',
}));

const ServiceStatusTooltip = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  maxWidth: '300px',
}));

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  error?: string;
}

const AIChatButton: React.FC = () => {
  const { user } = useUser();
  const { account } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const theme = useTheme();

  useEffect(() => {
    const checkServiceHealth = async () => {
      const isHealthy = await mcpService.checkHealth();
      setIsServiceAvailable(isHealthy);
    };
    checkServiceHealth();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || !account) return;

    setIsLoading(true);
    const userMessage: Message = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const response = await mcpService.sendQuery(
        inputMessage,
        user._id,
        account._id,
        {
          temperature: 0.7,
          maxTokens: 150
        }
      );

      const aiMessage: Message = {
        text: response.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTooltipTitle = () => {
    if (!user) {
      return 'Please sign in to use the Cloud Architecture Assistant';
    }
    if (!account) {
      return 'Please select an account to use the Cloud Architecture Assistant';
    }
    if (!isServiceAvailable) {
      return 'Cloud Architecture Assistant is currently unavailable';
    }
    return 'Ask a question about your cloud architecture';
  };

  return (
    <>
      <Tooltip title={getTooltipTitle()}>
        <FloatingButton
          variant="contained"
          startIcon={<ArchitectureIcon sx={{ fontSize: 28 }} />}
          onClick={() => setIsOpen(!isOpen)}
          disabled={!isServiceAvailable || !user || !account}
        >
          {isLoading ? 
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LoadingOutlined style={{ marginRight: 8 }} />
              Processing...
            </Box> : 
            "Cloud Assistant"
          }
        </FloatingButton>
      </Tooltip>

      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit timeout={1000}>
        <ChatContainer>
          <ChatHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {!isServiceAvailable ? 
                <ErrorIcon sx={{ fontSize: 28 }} /> : 
                <SupportAgentIcon sx={{ fontSize: 28 }} />
              }
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Cloud Architecture Assistant
                {!isServiceAvailable && (
                  <Typography variant="caption" color="error" sx={{ ml: 1, opacity: 0.9 }}>
                    (Offline)
                  </Typography>
                )}
              </Typography>
            </Box>
            <IconButton size="medium" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </ChatHeader>

          <ChatMessages>
            {messages.map((message, index) => (
              <Fade in={true} key={index} timeout={1000}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                    mb: 3,
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      backgroundColor: message.isUser
                        ? theme.palette.primary.main
                        : message.error
                        ? theme.palette.error.light
                        : '#ffffff',
                      color: message.isUser ? 'white' : 'inherit',
                      borderRadius: '18px',
                      position: 'relative',
                      boxShadow: message.isUser 
                        ? '0 4px 15px rgba(0, 0, 0, 0.15)' 
                        : '0 4px 15px rgba(0, 0, 0, 0.05)',
                      background: message.isUser 
                        ? theme.palette.primary.main
                        : '#ffffff',
                    }}
                  >
                    <Typography variant="body1">{message.text}</Typography>
                    {message.error && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: theme.palette.error.main,
                          mt: 1,
                        }}
                      >
                        Error: {message.error}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        bottom: -20,
                        right: message.isUser ? 0 : 'auto',
                        left: message.isUser ? 'auto' : 0,
                        color: theme.palette.text.secondary,
                        fontSize: '0.7rem',
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Paper>
                </Box>
              </Fade>
            ))}
            {isLoading && (
              <Fade in={true} timeout={1000}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Typography variant="body1">...</Typography>
                  </Paper>
                </Box>
              </Fade>
            )}
          </ChatMessages>

          <ChatInput>
            <TextField
              fullWidth
              size="medium"
              variant="outlined"
              placeholder={!isServiceAvailable ? 'Service is offline' : 'Ask something about your cloud architecture...'}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading || !isServiceAvailable}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&.Mui-focused fieldset': {
                    borderColor: '#6a11cb',
                  },
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading || !isServiceAvailable}
              sx={{ 
                p: 1.5, 
                backgroundColor: !inputMessage.trim() || isLoading || !isServiceAvailable ? 'transparent' : '#6a11cb',
                color: !inputMessage.trim() || isLoading || !isServiceAvailable ? 'inherit' : 'white',
                '&:hover': {
                  backgroundColor: !inputMessage.trim() || isLoading || !isServiceAvailable ? 'transparent' : '#5c0fb3',
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </ChatInput>
        </ChatContainer>
      </Slide>
    </>
  );
};

export default AIChatButton; 