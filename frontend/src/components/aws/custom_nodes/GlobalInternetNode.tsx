import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Chip } from '@mui/material';

const GlobalInternetNode = ({ data }: NodeProps) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '110px',
        height: '110px'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="110" height="110">
        <defs>
          <linearGradient id="techGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00C9FF"/>
            <stop offset="100%" stopColor="#8C4FFF"/>
          </linearGradient>
        </defs>

        {/* Main outline */}
        <circle cx="256" cy="256" r="240" fill="none" stroke="url(#techGradient)" strokeWidth="16"/>

        {/* Latitude lines (horizontal ellipses) */}
        <ellipse cx="256" cy="256" rx="240" ry="220" fill="none" stroke="url(#techGradient)" strokeWidth="1"/>
        <ellipse cx="256" cy="256" rx="240" ry="180" fill="none" stroke="url(#techGradient)" strokeWidth="1.5"/>
        <ellipse cx="256" cy="256" rx="240" ry="140" fill="none" stroke="url(#techGradient)" strokeWidth="1"/>
        <ellipse cx="256" cy="256" rx="240" ry="100" fill="none" stroke="url(#techGradient)" strokeWidth="1.5"/>
        <ellipse cx="256" cy="256" rx="240" ry="60" fill="none" stroke="url(#techGradient)" strokeWidth="1"/>
        <ellipse cx="256" cy="256" rx="240" ry="20" fill="none" stroke="url(#techGradient)" strokeWidth="1.5"/>

        {/* Longitude lines (vertical curves) */}
        <path d="M 256 16 C 320 80, 320 432, 256 496" fill="none" stroke="url(#techGradient)" strokeWidth="1.5"/>
        <path d="M 256 16 C 192 80, 192 432, 256 496" fill="none" stroke="url(#techGradient)" strokeWidth="1.5"/>
        <path d="M 256 16 C 352 96, 352 416, 256 496" fill="none" stroke="url(#techGradient)" strokeWidth="1.5"/>
        <path d="M 256 16 C 160 96, 160 416, 256 496" fill="none" stroke="url(#techGradient)" strokeWidth="1.5"/>
        <path d="M 256 16 C 384 128, 384 384, 256 496" fill="none" stroke="url(#techGradient)" strokeWidth="1.5"/>
        <path d="M 256 16 C 128 128, 128 384, 256 496" fill="none" stroke="url(#techGradient)" strokeWidth="1.5"/>
        <path d="M 256 16 C 416 144, 416 368, 256 496" fill="none" stroke="url(#techGradient)" strokeWidth="1"/>
        <path d="M 256 16 C 96 144, 96 368, 256 496" fill="none" stroke="url(#techGradient)" strokeWidth="1"/>
        <path d="M 256 16 C 288 80, 288 432, 256 496" fill="none" stroke="url(#techGradient)" strokeWidth="1"/>
        <path d="M 256 16 C 224 80, 224 432, 256 496" fill="none" stroke="url(#techGradient)" strokeWidth="1"/>

        {/* Equator line */}
        <line x1="16" y1="256" x2="496" y2="256" stroke="url(#techGradient)" strokeWidth="2"/>
      </svg>

      <Chip
        label="Internet"
        size="small"
        sx={{
          position: 'absolute',
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #00C9FF 0%, #8C4FFF 100%)',
          color: '#fff',
          fontSize: '0.65rem',
          fontWeight: 'bold',
          height: '20px',
          zIndex: 1
        }}
      />

      {/* Single target handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Bottom}
        style={{ background: 'url(#techGradient)', width: '12px', height: '12px' }}
      />
    </Box>
  );
};

export default memo(GlobalInternetNode); 