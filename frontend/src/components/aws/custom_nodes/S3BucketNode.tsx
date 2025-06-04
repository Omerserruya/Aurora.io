import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Chip } from '@mui/material';

const S3Icon = () => (
  <svg 
    width="48" 
    height="48" 
    viewBox="0 0 80 80" 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M52.836 34.893l.384-2.704c3.541 2.12 3.587 2.997 3.586 3.02-.006.006-.61.51-3.97-.316zm-1.943-.54c-6.12-1.852-14.643-5.762-18.092-7.392 0-.014.004-.027.004-.041 0-1.325-1.078-2.403-2.404-2.403-1.324 0-2.402 1.078-2.402 2.403 0 1.325 1.078 2.403 2.402 2.403.582 0 1.11-.217 1.527-.562 4.058 1.92 12.515 5.774 18.68 7.594l-2.438 17.206c-.007.047-.01.094-.01.141 0 1.515-6.707 4.298-17.666 4.298-11.075 0-17.853-2.783-17.853-4.298 0-.046-.003-.091-.009-.136L7 16.359c4.409 3.035 13.892 4.64 22.962 4.64 9.056 0 18.523-1.6 22.941-4.626l-2.548 17.98zM7 12.478c.072-1.316 7.634-6.478 23.5-6.478 15.864 0 23.427 5.16 23.5 6.478v.449c-.87 2.95-10.67 6.073-23.5 6.073-12.852 0-22.657-3.132-23.5-6.087v-.435zM56 12.5C56 9.035 46.066 4 30.5 4S5 9.035 5 12.5l.094.754 5.548 40.524C10.775 58.31 22.861 60 30.494 60c9.472 0 19.535-2.178 19.665-6.22l2.396-16.896c1.333.319 2.43.482 3.311.482 1.183 0 1.983-.289 2.468-.867.398-.474.55-1.048.436-1.659-.259-1.384-1.902-2.876-5.248-4.785l2.376-16.762L56 12.5z"
      fill="#1B660F"
    />
  </svg>
);

const S3BucketNode = ({ data }: NodeProps) => {
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
          backgroundColor: 'rgba(27, 102, 15, 0.05)',
          border: '2px solid rgba(27, 102, 15, 0.3)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          position: 'relative',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            backgroundColor: 'rgba(27, 102, 15, 0.08)',
            borderColor: 'rgba(27, 102, 15, 0.5)'
          },
          transition: 'all 0.2s ease'
        }}
      >
        <S3Icon />
        <Box sx={{ 
          color: '#1B660F',
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
        label="S3"
        size="small"
        sx={{
          position: 'absolute',
          top: -10,
          right: 0,
          backgroundColor: '#1B660F',
          color: '#fff',
          fontSize: '0.65rem',
          fontWeight: 'bold',
          height: '20px'
        }}
      />

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#1B660F' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#1B660F' }}
      />
    </Box>
  );
};

export default memo(S3BucketNode); 