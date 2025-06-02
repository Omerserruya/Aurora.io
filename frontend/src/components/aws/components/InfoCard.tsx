import React from 'react';
import { Box, Card, CardHeader, CardContent, Typography, Avatar } from '@mui/material';
import { getResourceIcon, getResourceColors, getResourceTypeName } from '../utils/resourceUtils';
import { Z_INDEX } from '../utils/constants';

interface InfoCardProps {
  type: string;
  label: string;
  resourceDetails: React.ReactNode;
  width?: number;
}

/**
 * A reusable info card component for AWS resources
 * Used in VPC, Subnet, and other resource nodes
 */
const InfoCard: React.FC<InfoCardProps> = ({ 
  type, 
  label, 
  resourceDetails,
  width = 300
}) => {
  // Get the icon and colors for this resource type
  const icon = <Avatar src={getResourceIcon(type)} sx={{ width: 24, height: 24 }} />;
  const colors = getResourceColors(type);
  const resourceType = getResourceTypeName(type);
  
  return (
    <Card 
      sx={{ 
        boxShadow: 1,
        border: `1px solid ${colors.border}`,
        width: width,
        zIndex: Z_INDEX.HEADER
      }}
    >
      <CardHeader
        avatar={icon}
        title={
          <Typography variant="subtitle2" fontWeight="bold">
            {resourceType}
          </Typography>
        }
        sx={{
          bgcolor: colors.bgDark,
          p: 1,
        }}
      />
      <CardContent sx={{ p: 1, bgcolor: colors.bgLight }}>
        <Typography variant="body2" fontWeight="bold" noWrap>
          {label}
        </Typography>
        <Box sx={{ mt: 1 }}>
          {resourceDetails}
        </Box>
      </CardContent>
    </Card>
  );
};

export default InfoCard; 