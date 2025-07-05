import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText,
  ListItemIcon,
  useTheme,
  Divider
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import InfoIcon from '@mui/icons-material/Info';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import HomeIcon from '@mui/icons-material/Home';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import LinkIcon from '@mui/icons-material/Link';

type SectionId = 'intro' | 'getStarted' | 'homePage' | 'visualization' | 'exportIac' | 'chatArchitect';

interface Section {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
  path: string;
}

function Documentation() {
  const [selectedSection, setSelectedSection] = useState<SectionId>('intro');
  const [content, setContent] = useState('');
  const theme = useTheme();

  const sections: Section[] = [
    { id: 'intro', title: 'Intro / About', icon: <InfoIcon />, path: '/docs/intro.md' },
    { id: 'getStarted', title: 'Get Started', icon: <RocketLaunchIcon />, path: '/docs/getStarted.md' },
    { id: 'homePage', title: 'Home Page', icon: <HomeIcon />, path: '/docs/homePage.md' },
    { id: 'visualization', title: 'Visualization', icon: <AccountTreeIcon />, path: '/docs/visualization.md' },
    { id: 'exportIac', title: 'Export to IaC', icon: <CodeIcon />, path: '/docs/exportIac.md' },
    { id: 'chatArchitect', title: 'Chat with Architect', icon: <ChatIcon />, path: '/docs/chatArchitect.md' }
  ];

  useEffect(() => {
    const section = sections.find(s => s.id === selectedSection);
    if (section) {
      fetch(section.path)
        .then(response => response.text())
        .then(text => setContent(text))
        .catch(error => console.error('Error loading markdown:', error));
    }
  }, [selectedSection]);

  const handleSectionChange = (section: SectionId) => {
    setSelectedSection(section);
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <Paper 
        elevation={0}
        sx={{ 
          width: 280,
          borderRight: `1px solid ${theme.palette.divider}`,
          overflow: 'auto',
          backgroundColor: theme.palette.background.default
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon color="primary" />
            Documentation
          </Typography>
        </Box>
        <Divider />
        <List>
          {sections.map((section) => (
            <ListItem key={section.id} disablePadding>
              <ListItemButton
                selected={selectedSection === section.id}
                onClick={() => handleSectionChange(section.id)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.action.selected,
                    '&:hover': {
                      backgroundColor: theme.palette.action.selected,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {section.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={section.title}
                  primaryTypographyProps={{
                    fontWeight: selectedSection === section.id ? 'bold' : 'normal'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 4,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.divider,
          borderRadius: '4px',
        },
      }}>
        <Box sx={{ 
          maxWidth: '900px', 
          mx: 'auto'
        }}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <Typography variant="h4" gutterBottom {...props} />,
              h2: ({node, ...props}) => <Typography variant="h5" gutterBottom {...props} />,
              h3: ({node, ...props}) => <Typography variant="h6" gutterBottom {...props} />,
              p: ({node, ...props}) => <Typography variant="body1" paragraph {...props} />,
              a: ({node, ...props}) => <Typography component="a" color="primary" sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }} {...props} />,
              hr: () => <Divider sx={{ my: 4 }} />,
            }}
          >
            {content}
          </ReactMarkdown>
        </Box>
      </Box>
    </Box>
  );
}

export default Documentation; 