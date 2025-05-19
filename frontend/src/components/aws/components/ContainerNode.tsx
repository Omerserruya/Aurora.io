import React, { memo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';
import { AWSNodeData } from '../awsNodes';
import { RESOURCE_COLORS } from '../constants';
import { getResourceIcon } from '../utils/resourceUtils';

interface GroupHeader {
  type: string;
  count: number;
}

/**
 * Container node component for parent resources that can have child nodes
 */
const ContainerNode = memo(({ data, selected, isConnectable }: NodeProps<AWSNodeData>) => {
  // Get the resource type from data
  const resourceType = data.type || 'generic';
  
  // Get color scheme based on resource type
  const colorScheme = RESOURCE_COLORS[resourceType] || RESOURCE_COLORS.generic;
  
  // Get the resource icon
  const resourceIcon = getResourceIcon(resourceType);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        border: selected ? `3px solid ${colorScheme.border}` : `2px solid ${colorScheme.border}`,
        borderRadius: '12px',
        background: `${colorScheme.bgLight}90`, // More transparency
        boxShadow: selected 
          ? `0 0 20px rgba(0, 0, 0, 0.3), 0 0 0 2px ${colorScheme.border}`
          : '0 4px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: `0 8px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px ${colorScheme.border}`
        }
      }}
    >
      {/* Container Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          borderTopLeftRadius: '10px',
          borderTopRightRadius: '10px',
          backgroundColor: colorScheme.bgLight,
          borderBottom: `2px solid ${colorScheme.border}`,
          minHeight: 60,
          zIndex: 10
        }}
      >
        {resourceIcon && (
          <Box sx={{ marginRight: 2 }}>
            <img src={resourceIcon} alt={resourceType} width={32} height={32} />
          </Box>
        )}
        <Typography variant="h6" sx={{ 
          fontWeight: 'bold',
          fontSize: '1.2rem',
          color: colorScheme.bgDark
        }}>
          {data.label || 'Container'}
        </Typography>
        {data.resourceId && (
          <Typography variant="body2" sx={{ ml: 2, opacity: 0.8, fontSize: '0.9rem' }}>
            {data.resourceId}
          </Typography>
        )}
      </Box>

      {/* Container Body - This is where child nodes will be rendered */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          padding: 3,
          overflow: 'visible',
          minHeight: '200px'
        }}
      >
        {/* Visual indicator for child containment area */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: `1px dashed ${colorScheme.border}60`,
            borderRadius: '8px',
            pointerEvents: 'none', // Don't block interactions
            zIndex: 1,
            background: `linear-gradient(135deg, ${colorScheme.bgLight}30 25%, transparent 25%, transparent 50%, ${colorScheme.bgLight}20 50%, ${colorScheme.bgLight}20 75%, transparent 75%, transparent)`,
            backgroundSize: '40px 40px'
          }}
        />
      </Box>

      {/* Handles for connecting edges */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ 
          background: colorScheme.border, 
          width: 12, 
          height: 12, 
          top: -6,
          border: `2px solid #fff`
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ 
          background: colorScheme.border, 
          width: 12, 
          height: 12, 
          bottom: -6,
          border: `2px solid #fff`
        }}
      />
    </Box>
  );
});

export default ContainerNode; 