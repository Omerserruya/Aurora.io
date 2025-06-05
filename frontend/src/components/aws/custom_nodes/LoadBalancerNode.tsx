import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Chip } from '@mui/material';

const LoadBalancerIcon = () => (
  <svg 
    width="48" 
    height="48" 
    viewBox="0 0 80 80" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M30,53 C22.832,53 17,47.168 17,40 C17,32.832 22.832,27 30,27 C37.168,27 43,32.832 43,40 C43,47.168 37.168,53 30,53 M60,59 C60,61.206 58.206,63 56,63 C53.794,63 52,61.206 52,59 C52,56.794 53.794,55 56,55 C58.206,55 60,56.794 60,59 M56,17 C58.206,17 60,18.794 60,21 C60,23.206 58.206,25 56,25 C53.794,25 52,23.206 52,21 C52,18.794 53.794,17 56,17 M59,36 C61.206,36 63,37.794 63,40 C63,42.206 61.206,44 59,44 C56.794,44 55,42.206 55,40 C55,37.794 56.794,36 59,36 M44.949,41 L53.09,41 C53.568,43.833 56.033,46 59,46 C62.309,46 65,43.309 65,40 C65,36.691 62.309,34 59,34 C56.033,34 53.568,36.167 53.09,39 L44.949,39 C44.823,37.099 44.344,35.297 43.572,33.654 L52.446,25.823 C53.442,26.559 54.669,27 56,27 C59.309,27 62,24.309 62,21 C62,17.691 59.309,15 56,15 C52.691,15 50,17.691 50,21 C50,22.256 50.389,23.421 51.051,24.386 L42.581,31.859 C39.904,27.738 35.271,25 30,25 C21.729,25 15,31.729 15,40 C15,48.271 21.729,55 30,55 C35.271,55 39.904,52.262 42.581,48.141 L51.051,55.614 C50.389,56.579 50,57.744 50,59 C50,62.309 52.691,65 56,65 C59.309,65 62,62.309 62,59 C62,55.691 59.309,53 56,53 C54.669,53 53.442,53.441 52.446,54.177 L43.572,46.346 C44.344,44.703 44.823,42.901 44.949,41" 
      fill="#9c27b0"
    />
  </svg>
);

const LoadBalancerNode = ({ data }: NodeProps) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100px',
        height: '80px'
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(156, 39, 176, 0.05)',
          border: '2px solid rgba(156, 39, 176, 0.3)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          position: 'relative',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            backgroundColor: 'rgba(156, 39, 176, 0.08)',
            borderColor: 'rgba(156, 39, 176, 0.5)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <LoadBalancerIcon />
        <Box sx={{ 
          color: '#9c27b0',
          fontSize: '0.75rem',
          fontWeight: 'medium',
          textAlign: 'center',
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {data.label}
        </Box>
      </Box>

      <Chip
        label="ALB"
        size="small"
        sx={{
          position: 'absolute',
          top: -10,
          right: 0,
          backgroundColor: '#9c27b0',
          color: '#fff',
          fontSize: '0.65rem',
          fontWeight: 'bold',
          height: '20px'
        }}
      />

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#9c27b0' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#9c27b0' }}
      />
    </Box>
  );
};

export default memo(LoadBalancerNode); 