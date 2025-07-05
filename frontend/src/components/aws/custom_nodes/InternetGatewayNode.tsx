import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Chip } from '@mui/material';

const IGWIcon = () => (
    <svg
    width="50px"
    height="50px"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="256"
      cy="256"
      r="240"
      stroke="#8C4FFF"
      strokeWidth="32"
      fill="none"
    />
    <path
      d="M160 352V224C160 189.255 188.255 160 223 160H289C323.745 160 352 188.255 352 223V352"
      stroke="#8C4FFF"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const InternetGatewayNode = ({ data }: NodeProps) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '60px',
        height: '60px'
      }}
    >
      <Chip
        label="IGW"
        size="small"
        sx={{
          position: 'absolute',
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#8C4FFF',
          color: '#fff',
          fontSize: '0.65rem',
          fontWeight: 'bold',
          height: '20px',
          zIndex: 1
        }}
      />

      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: 'rgba(140, 79, 255, 0.05)',
          border: '2px solid rgba(140, 79, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            backgroundColor: 'rgba(140, 79, 255, 0.08)',
            borderColor: 'rgba(140, 79, 255, 0.5)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <IGWIcon />
      </Box>

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#8C4FFF' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#8C4FFF' }}
      />
    </Box>
  );
};

export default memo(InternetGatewayNode); 