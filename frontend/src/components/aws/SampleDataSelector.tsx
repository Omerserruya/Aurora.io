import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid
} from '@mui/material';
import sampleCompleteArchitecture from '../../data/sample-aws-architecture.json';
import { AWSResources } from './types';

// Define a generic type for AWS data to support both interfaces
type AWSData = AWSResources | any; // Using 'any' to support AWSArchitecture

const samples: { name: string; description: string; data: AWSData }[] = [
  {
    name: 'Complete Architecture',
    description: 'A comprehensive AWS architecture with all supported resource types',
    data: sampleCompleteArchitecture as AWSData
  }
];

interface SampleDataSelectorProps {
  onDataSelected: (data: AWSData) => void;
}

/**
 * Component to select sample AWS architecture data for visualization
 */
const SampleDataSelector: React.FC<SampleDataSelectorProps> = ({ onDataSelected }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        AWS Architecture Samples
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        Choose a pre-configured AWS architecture sample to visualize. These samples demonstrate all 17 resource types and their relationships.
      </Typography>
      
      <Grid container spacing={2}>
        {samples.map((sample, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {sample.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {sample.description}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => onDataSelected(sample.data)}
                  fullWidth
                >
                  Load Sample
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SampleDataSelector; 