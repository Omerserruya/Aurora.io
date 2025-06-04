import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { Box, Chip } from '@mui/material';

const VpcIcon = () => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 80 80" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M61 41.372l-5.5-2.2v19.95c1.606-.16 2.901-.688 3.821-1.622 1.7-1.728 1.68-4.261 1.679-4.286V41.372zm-7.5 17.764V39.172L48 41.372v11.823c.007.207.234 5.357 5.5 5.941zm9.5-5.941c.003.113.053 3.347-2.235 5.69-1.496 1.533-3.605 2.31-6.265 2.31-6.573 0-8.435-5.218-8.5-7.976V40.695c0-.41.249-.777.629-.93l7.5-3c.238-.095.504-.095.742 0l7.5 3c.38.153.629.52.629.93v12.5zm3.001-1.966l-.001-13.357-11.5-4.6-11.5 4.6v13.323c-.002.09-.135 6.228 3.534 10.004 1.932 1.988 4.612 2.996 7.966 2.996 3.377 0 6.07-1.015 8.004-3.016 3.664-3.792 3.499-9.89 3.497-9.95zm-2.059 11.339c-2.325 2.407-5.502 3.627-9.442 3.627-3.921 0-7.087-1.216-9.41-3.614-4.259-4.393-4.099-11.133-4.09-11.417V37.195c0-.41.249-.777.629-.93l12.5-5c.238-.095.504-.095.742 0l12.5 5c.38.153.629.52.629.93v14c.009.25.189 6.978-4.058 11.373zM23.055 47.195H38v2h-14.945c-6.078 0-10.718-4.052-11.031-9.635-.022-.228-.024-.494-.024-.76 0-6.869 4.803-9.398 7.604-10.288-.02-.321-.03-.646-.03-.973 0-5.453 3.89-11.158 9.047-13.27 6.056-2.48 12.441-1.279 17.074 3.207 1.561 1.521 2.751 3.145 3.612 4.934 1.206-1.035 2.662-1.591 4.222-1.591 3.305 0 6.801 2.594 7.402 7.563 2.183.55 4.923 1.718 6.857 4.198l-1.576 1.23c-1.782-2.286-4.471-3.238-6.412-3.636-.445-.09-.772-.468-.798-.92-.261-4.421-3.02-6.435-5.473-6.435-1.462 0-2.758.69-3.749 1.995-.221.292-.581.443-.945.385-.361-.055-.665-.302-.79-.645-.767-2.09-1.991-3.936-3.743-5.643-4.044-3.914-9.626-4.959-14.923-2.791-4.449 1.822-7.805 6.731-7.805 11.419 0 .541.031 1.076.094 1.589.061.501-.263.969-.753 1.091-2.582.639-6.915 2.605-6.915 8.581 0 .202-.002.405.018.608.254 4.528 4.054 7.787 9.037 7.787z" 
      fill="#1976d2"
    />
  </svg>
);

const VpcNode = ({ data, selected }: NodeProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        padding: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(25, 118, 210, 0.02)',
        border: '2px dashed rgba(25, 118, 210, 0.3)',
        position: 'relative',
        backdropFilter: 'blur(8px)',
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.04)',
          borderColor: 'rgba(25, 118, 210, 0.5)'
        },
        transition: 'all 0.2s ease'
      }}
    >
      <NodeResizer 
        minWidth={400} 
        minHeight={300}
        isVisible={selected}
        lineStyle={{ border: '2px solid #1976d2' }}
        handleStyle={{ 
          width: 8, 
          height: 8, 
          backgroundColor: '#1976d2',
          borderRadius: 1
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <VpcIcon />
        <Box sx={{ 
          color: '#1976d2',
          fontWeight: 'medium',
          fontSize: '0.875rem',
          flexGrow: 1
        }}>
          {data.label}
        </Box>
        <Chip
          label="VPC"
          size="small"
          sx={{
            backgroundColor: '#1976d2',
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
        style={{ background: '#1976d2' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#1976d2' }}
      />
    </Box>
  );
};

export default memo(VpcNode); 