import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Chip } from '@mui/material';

const SubnetIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 80 80" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M56 32h-2v-8c0-7.732-6.268-14-14-14s-14 6.268-14 14v8h-2c-2.757 0-5 2.243-5 5v25c0 2.757 2.243 5 5 5h32c2.757 0 5-2.243 5-5V37c0-2.757-2.243-5-5-5zm-27-8c0-6.065 4.935-11 11-11s11 4.935 11 11v8H29v-8zm29 38c0 1.103-.897 2-2 2H24c-1.103 0-2-.897-2-2V37c0-1.103.897-2 2-2h32c1.103 0 2 .897 2 2v25z M40 44c-2.206 0-4 1.794-4 4 0 1.858 1.28 3.411 3 3.858V56h2v-4.142c1.72-.447 3-2 3-3.858 0-2.206-1.794-4-4-4z"
      fill="#4caf50"
    />
  </svg>
);

const SubnetNode = ({ data }: NodeProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        padding: '5px 12px 12px 12px',
        borderRadius: 1,
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
        border: '1px solid rgba(76, 175, 80, 0.3)',
        position: 'relative',
        backdropFilter: 'blur(8px)',
        '&:hover': {
          backgroundColor: 'rgba(76, 175, 80, 0.08)',
          borderColor: 'rgba(76, 175, 80, 0.5)'
        },
        transition: 'all 0.2s ease'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          marginTop: '5px'
        }}
      >
        <SubnetIcon />
        <Box sx={{ 
          color: '#2e7d32',
          fontWeight: 'medium',
          fontSize: '0.875rem',
          flexGrow: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {data.label}
        </Box>
        <Chip
          label="Subnet"
          size="small"
          sx={{
            position: 'absolute',
            top: -10,
            right: 8,
            backgroundColor: '#4caf50',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            height: '20px'
          }}
        />
      </Box>

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#4caf50' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#4caf50' }}
      />
    </Box>
  );
};

export default memo(SubnetNode); 