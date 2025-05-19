import React, { memo, useContext } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, useTheme, Chip } from '@mui/material';

import { RESOURCE_COLORS } from '../constants';
import { getResourceIcon } from '../utils/resourceUtils';
import { AWSNodeData } from '../awsNodes';

// Unified AWS Node component that handles all resource types
const AWSNode = memo(({ data, selected }: NodeProps<AWSNodeData>) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Get the resource type from data
  const resourceType = data.type || 'generic';
  
  // Get color scheme based on resource type
  const colorScheme = RESOURCE_COLORS[resourceType] || RESOURCE_COLORS.generic;
  
  // Determine background and border color based on theme
  const backgroundColor = isDarkMode ? colorScheme.bgDark : colorScheme.bgLight;
  const borderColor = colorScheme.border;
  const textColor = colorScheme.text || (isDarkMode ? theme.palette.common.white : theme.palette.common.black);
  
  // Get the resource icon
  const resourceIcon = getResourceIcon(resourceType);
  
  // Handle selection styling
  const selectionBorder = selected ? `3px solid ${borderColor}` : `2px solid ${borderColor}`;
  const selectionShadow = selected 
    ? `0 0 15px ${borderColor}80, 0 0 0 2px ${borderColor}` 
    : `0 4px 8px rgba(0, 0, 0, 0.15)`;

  return (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        backgroundColor,
        border: selectionBorder,
        boxShadow: selectionShadow,
        minWidth: 220,
        maxWidth: 280,
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        opacity: data.faded ? 0.7 : 1,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px ${borderColor}`
        }
      }}
    >
      {/* Source handle - for outgoing connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: borderColor,
          width: 12,
          height: 12,
          bottom: -6,
          border: '2px solid #fff'
        }}
      />
      
      {/* Target handle - for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: borderColor,
          width: 12,
          height: 12,
          top: -6,
          border: '2px solid #fff'
        }}
      />
      
      {/* Resource Type Badge */}
      <Chip
        size="small"
        label={resourceType.toUpperCase()}
        sx={{
          position: 'absolute',
          top: -10,
          right: 16,
          backgroundColor: borderColor,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '0.65rem',
          height: 20,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
      
      {/* Resource Header with Icon */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 1.5,
        borderBottom: `1px solid ${borderColor}40`,
        paddingBottom: 1
      }}>
        {resourceIcon && (
          <Box sx={{ 
            marginRight: 1.5, 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: `${borderColor}20`,
            padding: 0.8,
            borderRadius: 1
          }}>
            <img
              src={resourceIcon}
              alt={resourceType}
              width={32}
              height={32}
              style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}
            />
          </Box>
        )}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            fontSize: '1rem',
            color: borderColor,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {data.label || 'Unknown Resource'}
        </Typography>
      </Box>
      
      {/* Resource Properties */}
      <Box sx={{ marginTop: 1 }}>
        {/* Resource ID */}
        {data.resourceId && (
          <Typography
            variant="body1"
            sx={{
              fontSize: '0.85rem',
              color: textColor,
              fontWeight: 500,
              opacity: 0.9,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 0.5,
              borderLeft: `3px solid ${borderColor}70`,
              paddingLeft: 1
            }}
          >
            ID: {data.resourceId}
          </Typography>
        )}
        
        {/* Display key properties */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'auto 1fr',
          gap: '4px 8px',
          mt: 1
        }}>
          {Object.entries(data)
            .filter(([key]) => !['label', 'type', 'resourceId', 'faded'].includes(key))
            .slice(0, 4)
            .map(([key, value]) => (
              <React.Fragment key={key}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    color: `${borderColor}`,
                    fontSize: '0.75rem',
                  }}
                >
                  {key}:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: textColor,
                    fontSize: '0.75rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </Typography>
              </React.Fragment>
            ))}
        </Box>
      </Box>
    </Box>
  );
});

export default AWSNode; 