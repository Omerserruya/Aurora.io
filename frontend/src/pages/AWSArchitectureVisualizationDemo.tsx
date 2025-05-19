import React, { useState } from 'react';
import { Box, Container, Typography, Tab, Tabs, Paper } from '@mui/material';
import AWSArchitectureVisualizer from '../components/aws-architecture-visualizer';
import CloudDiagram from '../components/aws/CloudDiagram';
import SampleDataSelector from '../components/aws/SampleDataSelector';
import { AWSArchitecture } from '../components/aws-architecture-visualizer';
import { AWSResources } from '../components/aws/types';

// Generic type for AWS data to handle both interfaces
type AWSData = AWSArchitecture | AWSResources;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`visualization-tabpanel-${index}`}
      aria-labelledby={`visualization-tab-${index}`}
      {...other}
      style={{ height: 'calc(100vh - 250px)' }}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `visualization-tab-${index}`,
    'aria-controls': `visualization-tabpanel-${index}`,
  };
}

const AWSArchitectureVisualizationDemo: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [awsData, setAwsData] = useState<AWSData | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDataSelected = (data: AWSData) => {
    setAwsData(data);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AWS Architecture Visualization Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This demo showcases two different visualization methods for AWS architecture:
        <strong> Cloud Diagram</strong> (interactive flow-based) and <strong>AWS Visualizer</strong> (card-based).
        Both visualizations display the same data using different presentation styles.
      </Typography>
      
      <SampleDataSelector onDataSelected={handleDataSelected} />
      
      {awsData ? (
        <>
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="Visualization tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Cloud Diagram (Interactive Flow)" {...a11yProps(0)} />
              <Tab label="AWS Visualizer (Card View)" {...a11yProps(1)} />
            </Tabs>
          </Paper>
          
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ height: '100%', border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
              <CloudDiagram awsData={awsData} />
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ height: '100%', border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
              <AWSArchitectureVisualizer data={awsData} height="100%" width="100%" />
            </Box>
          </TabPanel>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Select a sample architecture from above to begin visualization
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default AWSArchitectureVisualizationDemo; 