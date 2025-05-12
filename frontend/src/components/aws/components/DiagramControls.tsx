import React from 'react';
import { Panel } from 'reactflow';
import { Button } from '@mui/material';

interface DiagramControlsProps {
  resetDiagram: () => void;
  fitView: () => void;
}

const DiagramControls: React.FC<DiagramControlsProps> = ({ resetDiagram, fitView }) => {
  return (
    <Panel position="top-right">
      <Button variant="outlined" size="small" onClick={resetDiagram} sx={{ mr: 1 }}>
        Reset
      </Button>
      <Button variant="outlined" size="small" onClick={fitView}>
        Fit View
      </Button>
    </Panel>
  );
};

export default DiagramControls; 