import React from 'react';
import { NodeProps } from 'reactflow';
import { Box, Avatar, Typography } from '@mui/material';
import { AWSNodeDataTypes } from '../awsNodes';
import BaseNode from './BaseNode';
import { getResourceIcon, getResourceColors, getResourceTypeName } from '../utils/resourceUtils';
import { getResourceDetails } from './ResourceDetails';

/**
 * A component for standard resource nodes like EC2, security groups, etc.
 */
const ResourceNode: React.FC<NodeProps<AWSNodeDataTypes>> = (props) => {
  const { data } = props;
  
  // Get resource styling
  const icon = getResourceIcon(data.type);
  const colors = getResourceColors(data.type);
  const resourceType = getResourceTypeName(data.type);
  
  return (
    <BaseNode {...props}>
      <Box sx={{ 
        padding: 1.5, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        {/* Resource header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 1, 
          pb: 1, 
          borderBottom: `1px solid ${colors.bgDark}` 
        }}>
          <Avatar 
            src={icon} 
            sx={{ 
              width: 20, 
              height: 20, 
              mr: 1, 
              bgcolor: colors.bgDark 
            }} 
          />
          <Typography variant="subtitle2" noWrap fontWeight="bold">
            {resourceType}
          </Typography>
        </Box>
        
        {/* Resource name/label */}
        <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }} noWrap>
          {data.label}
        </Typography>
        
        {/* Resource details */}
        <Box sx={{ fontSize: '0.7rem' }}>
          {getResourceDetails(data)}
        </Box>
      </Box>
    </BaseNode>
  );
};

export default ResourceNode; 