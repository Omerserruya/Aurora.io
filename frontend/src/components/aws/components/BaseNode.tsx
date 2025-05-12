import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box } from '@mui/material';
import { AWSNodeDataTypes } from '../awsNodes';
import { getResourceColors } from '../utils/resourceUtils';

/**
 * Base component for all AWS nodes
 * Handles common functionality like handles, selection state, etc.
 */
const BaseNode: React.FC<NodeProps<AWSNodeDataTypes> & { 
  children: React.ReactNode
}> = ({ 
  id, 
  data, 
  selected, 
  isConnectable,
  children 
}) => {
  // Get styling based on resource type
  const colors = getResourceColors(data.type);
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: '8px',
        border: `2px solid ${colors.border}`,
        background: 'rgba(255, 255, 255, 0.8)',
        boxShadow: selected ? '0 0 10px rgba(0, 0, 0, 0.2)' : 'none',
        '&:hover': {
          boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      {/* Handles for connecting edges */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
      
      {children}
    </Box>
  );
};

export default BaseNode; 