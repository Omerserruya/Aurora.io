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
  IconButton,
  useTheme,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import HomeIcon from '@mui/icons-material/Home';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import LinkIcon from '@mui/icons-material/Link';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { documentationService, DocumentationSection } from '../services/documentationService';
import { useAppSelector } from '../store/hooks';

type SectionId = 'intro' | 'getStarted' | 'homePage' | 'visualization' | 'exportIac' | 'chatArchitect' | string;

interface Section {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
}

// Default content for initial state
const DEFAULT_CONTENT: Record<SectionId, string> = {
  intro: `# Introduction to Aurora.io\n\nWelcome to Aurora.io, your intelligent infrastructure visualization and management platform.`,
  getStarted: `# Getting Started\n\nLearn how to get started with Aurora.io.`,
  homePage: `# Home Page\n\nExplore the features of the home page.`,
  visualization: `# Visualization\n\nDiscover the visualization capabilities.`,
  exportIac: `# Export to IaC\n\nLearn how to export your infrastructure as code.`,
  chatArchitect: `# Chat with Architect\n\nInteract with our AI assistant.`
};

// Icon mapping for different section types
const SECTION_ICONS: Record<string, React.ReactNode> = {
  intro: <InfoIcon />,
  getStarted: <RocketLaunchIcon />,
  homePage: <HomeIcon />,
  visualization: <AccountTreeIcon />,
  exportIac: <CodeIcon />,
  chatArchitect: <ChatIcon />,
  default: <InfoIcon />
};

function Documentation() {
  const user = useAppSelector((state) => state.user.user);
  const isAdmin = user?.role === 'admin';
  const [selectedSection, setSelectedSection] = useState<SectionId>('intro');
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(DEFAULT_CONTENT[selectedSection]);
  const [editTabIndex, setEditTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isNewSection, setIsNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const theme = useTheme();

  // Load sections when component mounts
  useEffect(() => {
    const loadSections = async () => {
      try {
        const docs = await documentationService.getAllSections();
        const formattedSections = docs.map(doc => ({
          id: doc.sectionId,
          title: doc.title,
          icon: SECTION_ICONS[doc.sectionId] || SECTION_ICONS.default
        }));
        setSections(formattedSections);
      } catch (err) {
        console.error('Error loading sections:', err);
        setError('Failed to load documentation sections');
      }
    };
    loadSections();
  }, []);

  // Load content when section changes
  useEffect(() => {
    if (isNewSection) return; // Don't load content for new section

    const loadContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const section = await documentationService.getSection(selectedSection);
        setContent(section.content);
      } catch (err) {
        console.error('Error loading documentation:', err);
        setError('Failed to load documentation. Using default content.');
        setContent(DEFAULT_CONTENT[selectedSection] || '');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [selectedSection, isNewSection]);

  const handleSectionChange = (section: SectionId) => {
    setSelectedSection(section);
    setIsEditing(false);
    setIsNewSection(false);
  };

  const handleNewSection = () => {
    setIsNewSection(true);
    setSelectedSection('new-section');
    setContent('# New Section\n\nStart writing your content here...');
    setNewSectionTitle('');
    setIsEditing(true);
    setEditTabIndex(0);
  };

  const handleSave = async () => {
    if (isNewSection && !newSectionTitle.trim()) {
      setError('Please enter a section title');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isNewSection) {
        // Create new section
        const sectionId = newSectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const createdSection = await documentationService.createSection({
          sectionId,
          title: newSectionTitle,
          content,
          lastModifiedBy: 'current-user' // TODO: Get from auth context
        });
        
        // Add new section to the list
        setSections(prev => [...prev, {
          id: createdSection.sectionId,
          title: createdSection.title,
          icon: SECTION_ICONS.default
        }]);
        
        setSuccess('New section created successfully');
        setIsNewSection(false);
        setSelectedSection(sectionId);
      } else {
        // Update existing section
        const currentSection = sections.find(s => s.id === selectedSection);
        if (!currentSection) {
          throw new Error('Section not found');
        }

        await documentationService.updateSection(selectedSection, {
          content,
          lastModifiedBy: 'current-user', // TODO: Get from auth context
          title: currentSection.title
        });
        setSuccess('Documentation updated successfully');
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving documentation:', err);
      setError(isNewSection ? 'Failed to create new section' : 'Failed to save documentation');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setEditTabIndex(0);
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setEditTabIndex(newValue);
  };

  const handleDeleteSection = async (sectionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent section selection when clicking delete
    
    if (!window.confirm('Are you sure you want to delete this section?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await documentationService.deleteSection(sectionId);
      
      // Remove section from the list
      setSections(prev => prev.filter(s => s.id !== sectionId));
      
      // If the deleted section was selected, select the first available section
      if (selectedSection === sectionId) {
        const remainingSections = sections.filter(s => s.id !== sectionId);
        if (remainingSections.length > 0) {
          setSelectedSection(remainingSections[0].id);
        } else {
          setSelectedSection('intro');
        }
      }
      
      setSuccess('Section deleted successfully');
    } catch (err) {
      console.error('Error deleting section:', err);
      setError('Failed to delete section');
    } finally {
      setLoading(false);
    }
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
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon color="primary" />
            Documentation
          </Typography>
        </Box>
        <Divider />
        <List>
          {sections.map((section) => (
            <ListItem 
              key={section.id} 
              disablePadding
              secondaryAction={
                isAdmin && (
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={(e) => handleDeleteSection(section.id, e)}
                    sx={{ 
                      opacity: 0.6,
                      '&:hover': {
                        opacity: 1,
                        color: 'error.main'
                      }
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )
              }
            >
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
          {isAdmin && (
            <>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton onClick={handleNewSection}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <AddIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="New Section"
                    primaryTypographyProps={{
                      color: 'primary'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {isNewSection ? (
            <TextField
              label="Section Title"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Enter section title"
              sx={{ width: 300 }}
            />
          ) : (
            <Typography variant="h5">
              {sections.find(s => s.id === selectedSection)?.title || 'Documentation'}
            </Typography>
          )}
          {isAdmin && (
            <Tooltip title={isEditing ? "Save Changes" : "Edit Content"}>
              <IconButton 
                onClick={isEditing ? handleSave : handleEditToggle} 
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : (isEditing ? <SaveIcon /> : <EditIcon />)}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {isEditing ? (
          <Box sx={{ height: 'calc(100vh - 180px)' }}>
            <Tabs
              value={editTabIndex}
              onChange={handleTabChange}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider', 
                mb: 2,
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontWeight: 500
                }
              }}
            >
              <Tab 
                icon={<EditNoteIcon />} 
                label="Edit" 
                iconPosition="start"
              />
              <Tab 
                icon={<VisibilityIcon />} 
                label="Preview" 
                iconPosition="start"
              />
            </Tabs>
            
            {/* Edit View */}
            {editTabIndex === 0 && (
              <Box sx={{ height: 'calc(100% - 48px)' }}>
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '16px',
                    border: 'none',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    resize: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
              </Box>
            )}
            
            {/* Preview View */}
            {editTabIndex === 1 && (
              <Box sx={{ 
                height: 'calc(100% - 48px)', 
                overflow: 'auto', 
                px: 2,
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
            )}
          </Box>
        ) : (
          <Box sx={{ 
            maxWidth: '900px', 
            mx: 'auto',
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
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
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
            )}
          </Box>
        )}

        {/* Error Snackbar */}
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>

        {/* Success Snackbar */}
        <Snackbar 
          open={!!success} 
          autoHideDuration={3000} 
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}

export default Documentation; 