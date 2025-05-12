import React from 'react';
import { NodeProps } from 'reactflow';
import { Box, Typography } from '@mui/material';
import { AWSNodeDataTypes } from '../awsNodes';
import BaseNode from './BaseNode';
import InfoCard from './InfoCard';
import { getResourceDetails } from './ResourceDetails';
import { NODE_DIMENSIONS } from '../utils/constants';

/**
 * Container node for VPC and Subnet resources
 * Has an info card at the top and a content area below for child nodes
 */
const ContainerNode: React.FC<NodeProps<AWSNodeDataTypes>> = (props) => {
  const { data, type } = props;
  
  // Get info card dimensions based on node type
  const infoCardHeight = type === 'vpc' 
    ? NODE_DIMENSIONS.VPC.INFO_CARD_HEIGHT
    : NODE_DIMENSIONS.SUBNET.INFO_CARD_HEIGHT;
    
  const padding = type === 'vpc'
    ? NODE_DIMENSIONS.VPC.PADDING
    : NODE_DIMENSIONS.SUBNET.PADDING;
    
  // Get resource details to display in the info card
  const resourceDetails = getResourceDetails(data);
  
  return (
    <BaseNode {...props}>
      {/* Info card section at the top */}
      <Box 
        sx={{ 
          padding: `${padding}px`,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 2
        }}
      >
        <InfoCard
          type={data.type}
          label={data.label}
          resourceDetails={resourceDetails}
        />
      </Box>
      
      {/* Content area for child nodes - positioned below the info card */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: `${infoCardHeight + padding}px`,
          left: 0,
          width: '100%',
          height: `calc(100% - ${infoCardHeight + padding}px)`,
          padding: '0' // No additional padding to maintain alignment
        }}
      />
    </BaseNode>
  );
};

export default ContainerNode; 