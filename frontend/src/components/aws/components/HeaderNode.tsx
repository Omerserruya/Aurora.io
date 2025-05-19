import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { Box, Typography } from '@mui/material';
import { AWSNodeData } from '../awsNodes';
import { RESOURCE_COLORS } from '../constants';
import { getResourceIcon } from '../utils/resourceUtils';

/**
 * Header node component for container titles
 */
const HeaderNode = memo(({ data }: NodeProps<AWSNodeData>) => {
  // Get the resource type from data
  const resourceType = data.type || 'generic';
  const parentType = data.parentType || resourceType;
  
  // Get color scheme based on parent resource type
  const colorScheme = RESOURCE_COLORS[parentType] || RESOURCE_COLORS.generic;
  
  // Get the resource icon
  const resourceIcon = getResourceIcon(parentType);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: 2,
        backgroundColor: colorScheme.bgDark,
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      }}
    >
      {resourceIcon && (
        <Box sx={{ marginRight: 2 }}>
          <img src={resourceIcon} alt={parentType} width={32} height={32} />
        </Box>
      )}
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 'bold',
          color: '#fff',
          fontSize: '1.5rem',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
        }}
      >
        {data.label || 'Container'}
      </Typography>
    </Box>
  );
});

export default HeaderNode; 