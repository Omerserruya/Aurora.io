import React, { useState } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography, Paper } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

// Import sample data
import sampleCompleteArchitecture from '../../data/sample-aws-architecture.json';

// Define available sample data options
const SAMPLE_OPTIONS = [
  { id: 'complete', label: 'Complete Architecture (All Resources)', data: sampleCompleteArchitecture },
];

export interface SampleDataSelectorProps {
  onDataSelected: (data: any) => void;
}

const SampleDataSelector: React.FC<SampleDataSelectorProps> = ({ onDataSelected }) => {
  const [selectedSample, setSelectedSample] = useState<string>('');

  const handleChange = (event: SelectChangeEvent) => {
    const sampleId = event.target.value;
    setSelectedSample(sampleId);
    
    // Find the selected sample data
    const selectedData = SAMPLE_OPTIONS.find(option => option.id === sampleId);
    if (selectedData) {
      onDataSelected(selectedData.data);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        AWS Architecture Samples
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose a pre-configured AWS architecture sample to visualize. These samples demonstrate all 17 resource types and their relationships.
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel id="sample-data-select-label">Sample Architecture</InputLabel>
          <Select
            labelId="sample-data-select-label"
            id="sample-data-select"
            value={selectedSample}
            label="Sample Architecture"
            onChange={handleChange}
          >
            {SAMPLE_OPTIONS.map(option => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button 
          variant="contained" 
          disabled={!selectedSample}
          onClick={() => {
            const selectedData = SAMPLE_OPTIONS.find(option => option.id === selectedSample);
            if (selectedData) {
              onDataSelected(selectedData.data);
            }
          }}
        >
          Load Sample
        </Button>
      </Box>
    </Paper>
  );
};

export default SampleDataSelector; 