import React from 'react';
import { Box, Paper, Typography, Divider, IconButton, List, ListItem, ListItemText, Chip } from '@mui/material';
import { AWSNode as AWSNodeType } from '../awsNodes';
import { getResourceColors, getResourceIcon, getResourceTypeName } from '../utils/resourceUtils';

interface ResourceDetailsPanelProps {
  selectedNode: AWSNodeType | null;
  onClose: () => void;
  nodes: AWSNodeType[];
}

const ResourceDetailsPanel: React.FC<ResourceDetailsPanelProps> = ({ 
  selectedNode, 
  onClose,
  nodes
}) => {
  if (!selectedNode) return null;

  return (
    <Paper sx={{ width: 300, ml: 2, p: 2, overflowY: 'auto' }}>
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        mb: 2,
        bgcolor: getResourceColors(selectedNode.data.type).bgDark,
        p: 1,
        borderRadius: 1,
        border: `1px solid ${getResourceColors(selectedNode.data.type).border}`
      }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img src={getResourceIcon(selectedNode.data.type)} alt={selectedNode.data.type} width="24" height="24" />
          <Typography variant="subtitle1" fontWeight="bold" sx={{ ml: 1 }}>
            {getResourceTypeName(selectedNode.data.type)}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Box sx={{ fontSize: 18 }}>×</Box>
        </IconButton>
      </Box>

      <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
        {selectedNode.data.label}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Resource ID
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {selectedNode.data.resourceId}
      </Typography>

      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Resource Type
      </Typography>
      <Chip 
        label={getResourceTypeName(selectedNode.data.type)} 
        size="small" 
        sx={{ 
          mb: 2,
          bgcolor: getResourceColors(selectedNode.data.type).bgLight,
          borderColor: getResourceColors(selectedNode.data.type).border,
          border: '1px solid'
        }} 
      />

      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Properties
      </Typography>
      <List dense>
        {Object.entries(selectedNode.data)
          .filter(([key]) => !['label', 'type', 'resourceId', 'parentId'].includes(key))
          .map(([key, value]) => (
            <ListItem key={key} divider>
              <ListItemText
                primary={key}
                secondary={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                primaryTypographyProps={{ fontWeight: "medium" }}
                secondaryTypographyProps={{
                  sx: {
                    wordBreak: "break-all",
                    whiteSpace: "normal",
                  },
                }}
              />
            </ListItem>
          ))}
      </List>

      {/* Resource-specific additional details */}
      {selectedNode.data.type === 'vpc' && (
        <>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
            Summary
          </Typography>
          <List dense>
            <ListItem divider>
              <ListItemText primary="Subnets" secondary={
                selectedNode.parentNode ? "This VPC is part of another VPC" : "View subnets in diagram"
              } />
            </ListItem>
          </List>
        </>
      )}

      {selectedNode.data.type === 'subnet' && (
        <>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
            Summary
          </Typography>
          <List dense>
            <ListItem divider>
              <ListItemText primary="Instances" secondary={
                // Count child nodes that are EC2 instances
                nodes.filter(n => n.parentNode === selectedNode.id && n.type === 'ec2').length || "0"
              } />
            </ListItem>
            <ListItem divider>
              <ListItemText primary="VPC ID" secondary={selectedNode.data.VpcId} />
            </ListItem>
          </List>
        </>
      )}
    </Paper>
  );
};

export default ResourceDetailsPanel; 