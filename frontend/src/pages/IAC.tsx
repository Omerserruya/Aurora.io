import React, { useState } from 'react';
import { Box, Typography, Paper, Stack, Button } from '@mui/material';
import CodeSnippet from '../components/CodeSnippet';
import ResourceSelector from '../components/ResourceSelector';
import DownloadIcon from '@mui/icons-material/Download';
import JSZip from 'jszip';

const resourceConfigs = {
  amis: `
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
}`,
  instances: `
resource "aws_instance" "web_server" {
  ami           = data.aws_ami.ami_web1.id
  instance_type = "t2.micro"

  tags = {
    Name = "WebServer"
    Environment = "Production"
  }
}

resource "aws_instance" "app_server" {
  ami           = data.aws_ami.ami_web2.id
  instance_type = "t2.small"

  tags = {
    Name = "AppServer"
    Environment = "Production"
  }
}`,
  vpcs: `
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "MainVPC"
    Environment = "Production"
  }
}

resource "aws_vpc" "staging" {
  cidr_block           = "172.16.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "StagingVPC"
    Environment = "Staging"
  }
}`,
  subnets: `
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-west-2a"
  map_public_ip_on_launch = true

  tags = {
    Name = "PublicSubnet"
    Environment = "Production"
  }
}

resource "aws_subnet" "private" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-west-2b"
  map_public_ip_on_launch = false

  tags = {
    Name = "PrivateSubnet"
    Environment = "Production"
  }
}`
};

function IAC() {
  const [selectedResource, setSelectedResource] = useState('amis');

  const handleResourceChange = (resource: string) => {
    setSelectedResource(resource);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    
    // Add each resource configuration to the zip
    Object.entries(resourceConfigs).forEach(([key, value]) => {
      zip.file(`${key}.tf`, value.trim());
    });

    try {
      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'terraform-configs.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
    }
  };

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
        <Stack spacing={1}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%'
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="h6" sx={{ flexShrink: 0 }}>
                TF Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can copy the entire configuration using the copy button in the top-right corner.
              </Typography>
            </Box>
            <Stack spacing={1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
              <ResourceSelector onResourceChange={handleResourceChange} />
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadAll}
                size="small"
                sx={{ width: '215px' }}
              >
                Download All as ZIP
              </Button>
            </Stack>
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <CodeSnippet 
              code={resourceConfigs[selectedResource as keyof typeof resourceConfigs]}
              filename={`${selectedResource}.tf`}
            />
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default IAC; 