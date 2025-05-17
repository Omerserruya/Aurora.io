import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Paper, TextField, Typography, useTheme, Fade, Slide, Tooltip, Button as MuiButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ReactMarkdown from 'react-markdown';
import { mcpService } from '../api/mcpService';
import { useUser } from '../hooks/compatibilityHooks';
import { useAccount } from '../hooks/compatibilityHooks';
import socketService from '../services/socketService';

const FloatingButton = styled(MuiButton)(({ theme }) => ({
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  height: '60px',
  padding: '0 24px 0 20px',
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
    marginRight: '14px',
    marginLeft: '0',
    transform: 'scale(1.5)',
  },
}));

const ChatContainer = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: '105px',
  right: '30px',
  width: 'calc(100vw * 4/9)',
  maxWidth: '800px',
  minWidth: '450px',
  height: '75vh',
  maxHeight: '850px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  zIndex: 1000,
  borderRadius: '18px',
  overflow: 'hidden',
  background: theme.palette.background.paper,
  [theme.breakpoints.up('xl')]: {
    height: '80vh',
    maxHeight: '1000px',
  },
  [theme.breakpoints.down('md')]: {
    height: '70vh',
    maxHeight: '700px',
  },
}));

const InlineChatContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 0,
  overflow: 'hidden',
  background: theme.palette.background.paper,
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 3),
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
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f9f9f9',
}));

const ChatInput = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  backgroundColor: theme.palette.background.paper,
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

interface AIChatButtonProps {
  isInline?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

const AIChatButton: React.FC<AIChatButtonProps> = ({ isInline = false, isOpen: propIsOpen, onToggle }) => {
  const { user } = useUser();
  const { account } = useAccount();
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'warning' | 'info' | 'success' });
  const theme = useTheme();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [chatIsOpen, setChatIsOpen] = useState(isInline ? propIsOpen : false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showError = (errorMessage: string) => {
    setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatIsOpen && user && account) {
      const socket = socketService.connect();
      
      if (socket) {
        socket.on('connect', () => {
          setSocketConnected(true);
          
          if (user && account) {
            const joined = socketService.joinRoom(user._id, account._id);
            if (joined) {
            }
          }
        });

        const handleRoomJoined = () => {
          setRoomJoined(true);
        };
        
        socket.on('room_joined', handleRoomJoined);
        
        const unsubscribeReceiveMessage = socketService.onReceiveMessage((data) => {
          const aiMessage: Message = {
            text: data.response,
            isUser: false,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
          setIsLoading(false);
        });
        
        const unsubscribeError = socketService.onError((error) => {
          console.error('Socket error:', error);
          showError(error.message || 'Failed to send message');
          setIsLoading(false);
        });
        
        if (socketConnected && user && account) {
          socketService.joinRoom(user._id, account._id);
        }
        
        return () => {
          socket.off('room_joined', handleRoomJoined);
          unsubscribeReceiveMessage();
          unsubscribeError();
          if (!chatIsOpen) {
            socketService.disconnect();
            setSocketConnected(false);
            setRoomJoined(false);
          }
        };
      }
    }
  }, [chatIsOpen, user, account, socketConnected]);

  useEffect(() => {
    const checkServiceHealth = async () => {
      const isHealthy = await mcpService.checkHealth();
      setIsServiceAvailable(isHealthy);
    };
    checkServiceHealth();
  }, []);

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      if (chatIsOpen) {
        setChatIsOpen(false);
      } else {
        setChatIsOpen(true);
        if (event.detail && event.detail.message) {
          setInputMessage(`Your analysis gave me this recommendation: ${event.detail.message}\nPlease instruct me how to fix that. Thank you!`);
        }
      }
      if (onToggle) onToggle();
    };
    window.addEventListener('open-ai-chat', handler as EventListener);
    return () => window.removeEventListener('open-ai-chat', handler as EventListener);
  }, [onToggle, chatIsOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || !account) return;

    setIsLoading(true);
    const userMessage: Message = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputMessage;
    setInputMessage('');

    if (socketConnected) {
      try {
        socketService.sendMessage({
          prompt: messageText,
          userId: user._id,
          connectionId: account._id,
          options: {
            temperature: 0.7,
            maxTokens: 150
          }
        });
      } catch (error) {
        console.error('Socket error:', error);
        sendMessageHttp(messageText);
      }
    } else {
      sendMessageHttp(messageText);
    }
  };

  const sendMessageHttp = async (messageText: string) => {
    try {
      const response = await mcpService.sendQuery(
        messageText,
        user!._id,
        account!._id,
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
      showError(error instanceof Error ? error.message : 'Failed to send message');
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
      return 'Action Required: Please select an account to activate the Cloud Assistant';
    }
    if (!isServiceAvailable) {
      return 'Cloud Architecture Assistant is currently unavailable';
    }
    return 'Ask a question about your cloud architecture';
  };

  if (isInline) {
    return (
      <InlineChatContainer>
        <ChatHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {!isServiceAvailable ? 
              <ErrorIcon sx={{ fontSize: 24 }} /> : 
              <PsychologyIcon sx={{ fontSize: 24 }} />
            }
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Cloud Assistant
              {!isServiceAvailable && (
                <Typography variant="caption" color="error" sx={{ ml: 1, opacity: 0.9 }}>
                  (Offline)
                </Typography>
              )}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onToggle} sx={{ color: 'white' }}>
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
                  mb: 2,
                }}
              >
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '90%',
                    backgroundColor: message.isUser
                      ? theme.palette.primary.main
                      : message.error
                      ? theme.palette.error.light
                      : theme.palette.mode === 'dark' 
                        ? theme.palette.background.paper 
                        : '#ffffff',
                    color: message.isUser ? 'white' : theme.palette.text.primary,
                    borderRadius: '12px',
                    position: 'relative',
                    boxShadow: message.isUser 
                      ? '0 2px 8px rgba(0, 0, 0, 0.15)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Typography variant="body2">
                    {message.isUser ? (
                      message.text
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <Typography variant="body2" component="p" color="inherit">{children}</Typography>,
                          h1: ({ children }) => <Typography variant="h1" component="h1" color="inherit">{children}</Typography>,
                          h2: ({ children }) => <Typography variant="h2" component="h2" color="inherit">{children}</Typography>,
                          h3: ({ children }) => <Typography variant="h3" component="h3" color="inherit">{children}</Typography>,
                          h4: ({ children }) => <Typography variant="h4" component="h4" color="inherit">{children}</Typography>,
                          h5: ({ children }) => <Typography variant="h5" component="h5" color="inherit">{children}</Typography>,
                          h6: ({ children }) => <Typography variant="h6" component="h6" color="inherit">{children}</Typography>,
                          code: ({ children }) => (
                            <Box
                              component="code"
                              sx={{
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.1)' 
                                  : 'rgba(0, 0, 0, 0.05)',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '0.9em',
                                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
                              }}
                            >
                              {children}
                            </Box>
                          ),
                          pre: ({ children }) => (
                            <Box
                              component="pre"
                              sx={{
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.1)' 
                                  : 'rgba(0, 0, 0, 0.05)',
                                padding: '12px',
                                borderRadius: '4px',
                                overflowX: 'auto',
                                margin: '8px 0',
                                color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
                              }}
                            >
                              {children}
                            </Box>
                          ),
                          ul: ({ children }) => (
                            <Box component="ul" sx={{ pl: 2, my: 1, color: 'inherit' }}>
                              {children}
                            </Box>
                          ),
                          ol: ({ children }) => (
                            <Box component="ol" sx={{ pl: 2, my: 1, color: 'inherit' }}>
                              {children}
                            </Box>
                          ),
                          li: ({ children }) => (
                            <Box component="li" sx={{ mb: 0.5, color: 'inherit' }}>
                              {children}
                            </Box>
                          ),
                          blockquote: ({ children }) => (
                            <Box
                              component="blockquote"
                              sx={{
                                borderLeft: '4px solid',
                                borderColor: theme.palette.primary.main,
                                pl: 2,
                                py: 0.5,
                                my: 1,
                                fontStyle: 'italic',
                                color: 'inherit',
                              }}
                            >
                              {children}
                            </Box>
                          ),
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    )}
                  </Typography>
                  {message.error && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: theme.palette.error.main,
                        mt: 0.5,
                      }}
                    >
                      Error: {message.error}
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Fade>
          ))}
          {isLoading && (
            <Fade in={true} timeout={1000}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '90%',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Typography variant="body2">...</Typography>
                </Paper>
              </Box>
            </Fade>
          )}
          <div ref={messagesEndRef} />
        </ChatMessages>

        <ChatInput>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder={!isServiceAvailable ? 'Service is offline' : 'Ask something...'}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading || !isServiceAvailable}
            multiline
            minRows={3}
            maxRows={8}
            inputProps={{ style: { overflowY: 'auto' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
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
              p: 1, 
              backgroundColor: !inputMessage.trim() || isLoading || !isServiceAvailable ? 'transparent' : '#6a11cb',
              color: !inputMessage.trim() || isLoading || !isServiceAvailable ? 'inherit' : 'white',
              '&:hover': {
                backgroundColor: !inputMessage.trim() || isLoading || !isServiceAvailable ? 'transparent' : '#5c0fb3',
              },
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </ChatInput>
      </InlineChatContainer>
    );
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 1000,
        }}
      >
        <Tooltip 
          title={getTooltipTitle()} 
          arrow
          placement="top"
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: !account ? '#f44336' : 'rgba(97, 97, 97, 0.92)',
                color: 'white',
                '& .MuiTooltip-arrow': {
                  color: !account ? '#f44336' : 'rgba(97, 97, 97, 0.92)',
                },
                fontWeight: !account ? 'bold' : 'normal',
                fontSize: !account ? '0.9rem' : '0.75rem',
                padding: !account ? '10px 16px' : '8px 12px',
              }
            }
          }}
        >
          <div>
            <FloatingButton
              variant="contained"
              startIcon={<PsychologyIcon />}
              onClick={onToggle}
              disabled={!isServiceAvailable || !user || !account}
              sx={{
                position: 'static',
                opacity: !account ? 0.8 : 1,
              }}
            >
              {isLoading ? 
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Processing...
                </Box> : 
                "Cloud Assistant"
              }
            </FloatingButton>
          </div>
        </Tooltip>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AIChatButton; 