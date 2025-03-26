import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import CodeSnippet from '../components/CodeSnippet';

const jsonExample = `
data "aws_ami" "ami_web1" {
  most_recent = true
  owners      = ["self"] 

  tags = {
    OS = "Ubuntu"
    Purpose = "WebServer1"
  }
}

data "aws_ami" "ami_web2" {
  most_recent = true
  owners      = ["self"] 

  tags = {
    OS = "AmazonLinux"
    Purpose = "WebServer2"
  }
}
`

function IAC() {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Infrastructure as Code
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 3,
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="h6" gutterBottom>
          TF Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          You can copy the entire configuration using the copy button in the top-right corner.
        </Typography>
        <CodeSnippet code={jsonExample} />
      </Paper>
    </Box>
  );
}

export default IAC; 