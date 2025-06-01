import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AWSNode } from '../awsNodes';
import { getResourceIcon, getResourceTypeName, formatProperties } from '../utils/resourceUtils';

interface ResourceDetailsPanelProps {
  selectedNode: AWSNode;
  onClose: () => void;
  nodes: AWSNode[];
}

/**
 * Panel to display detailed information about a selected AWS resource
 */
const ResourceDetailsPanel: React.FC<ResourceDetailsPanelProps> = ({
  selectedNode,
  onClose,
  nodes
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Get resource data
  const { data } = selectedNode;
  const resourceType = data.type || 'generic';
  
  // Get resource icon
  const resourceIcon = getResourceIcon(resourceType);
  
  // Format the properties for display
  const formattedProperties = formatProperties(data);
  
  // Get related nodes (connections)
  const relatedNodes = nodes.filter(node => {
    // Skip self comparison
    if (node.id === selectedNode.id) return false;
    
    // Check if this node is a parent of the selected node
    if (selectedNode.parentNode === node.id) return true;
    
    // Check if the selected node is a parent of this node
    if (node.parentNode === selectedNode.id) return true;
    
    return false;
  });

  return (
    <Paper
      elevation={3}
      sx={{
        width: 320,
        height: '100%',
        overflow: 'auto',
        bgcolor: isDarkMode ? 'background.paper' : '#f8f8f8',
        borderLeft: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: isDarkMode ? 'background.paper' : '#f0f0f0',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {resourceIcon && (
            <img
              src={resourceIcon}
              alt={resourceType}
              width={24}
              height={24}
              style={{ marginRight: 8 }}
            />
          )}
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            Resource Details
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        {/* Resource Type & Name */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          {getResourceTypeName(resourceType)}
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {data.label || 'Unnamed Resource'}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Resource ID */}
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Resource ID
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
          {data.resourceId || 'Not specified'}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Properties */}
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Properties
        </Typography>
        
        {Object.keys(formattedProperties).length > 0 ? (
          <List dense disablePadding>
            {Object.entries(formattedProperties).map(([key, value]) => (
              <ListItem key={key} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={key}
                  secondary={value}
                  primaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                    sx: { fontWeight: 'medium' }
                  }}
                  secondaryTypographyProps={{
                    variant: 'body2',
                    sx: { wordBreak: 'break-all' }
                  }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No additional properties available.
          </Typography>
        )}
        
        {/* Relationships section */}
        {relatedNodes.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Related Resources
            </Typography>
            
            <List dense disablePadding>
              {relatedNodes.map(node => (
                <ListItem key={node.id} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={node.data.label}
                    secondary={getResourceTypeName(node.data.type)}
                    primaryTypographyProps={{
                      variant: 'body2'
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: 'text.secondary'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default ResourceDetailsPanel; 