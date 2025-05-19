import React from 'react';
import { Box, ButtonGroup, Button, Tooltip, useTheme } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FitScreenIcon from '@mui/icons-material/FitScreen';

interface DiagramControlsProps {
  resetDiagram: () => void;
  fitView: () => void;
}

/**
 * Controls for the AWS cloud diagram, including reset and fit view buttons
 */
const DiagramControls: React.FC<DiagramControlsProps> = ({ resetDiagram, fitView }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
        padding: 0.5,
        borderRadius: 1,
        boxShadow: 1
      }}
    >
      <ButtonGroup size="small" aria-label="diagram controls">
        <Tooltip title="Reset diagram">
          <Button 
            onClick={resetDiagram}
            startIcon={<RefreshIcon />}
            sx={{ 
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Reset
          </Button>
        </Tooltip>
        <Tooltip title="Fit view">
          <Button 
            onClick={fitView}
            startIcon={<FitScreenIcon />}
            sx={{ 
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider, 
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Fit
          </Button>
        </Tooltip>
      </ButtonGroup>
    </Box>
  );
};

export default DiagramControls; 