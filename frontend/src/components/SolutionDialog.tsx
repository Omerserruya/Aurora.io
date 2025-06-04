import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReactMarkdown from 'react-markdown';

interface SolutionDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  solution: string;
}

export const SolutionDialog: React.FC<SolutionDialogProps> = ({
  open,
  onClose,
  title,
  solution
}) => {
  const theme = useTheme();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '60vh',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme.palette.grey[500],
            '&:hover': {
              color: theme.palette.grey[700],
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ 
          '& .markdown-body': {
            color: 'text.primary',
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              color: 'text.primary',
              fontWeight: 600,
              mt: 3,
              mb: 2
            },
            '& p': {
              mb: 2,
              lineHeight: 1.6
            },
            '& ul, & ol': {
              pl: 3,
              mb: 2
            },
            '& li': {
              mb: 1
            },
            '& code': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              padding: '2px 4px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            },
            '& pre': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              padding: '16px',
              borderRadius: '8px',
              overflowX: 'auto',
              '& code': {
                backgroundColor: 'transparent',
                padding: 0
              }
            },
            '& blockquote': {
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              pl: 2,
              py: 0.5,
              my: 2,
              fontStyle: 'italic',
              color: 'text.secondary'
            }
          }
        }}>
          <ReactMarkdown className="markdown-body">
            {solution}
          </ReactMarkdown>
        </Box>
      </DialogContent>
    </Dialog>
  );
}; 