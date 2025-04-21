import React, { useState } from 'react';
import { Typography, Box, Grid, Button, CircularProgress } from '@mui/material';
import { useUser } from '../contexts/UserContext';
import { useAccount } from '../contexts/AccountContext';
import AddIcon from '@mui/icons-material/Add';
import { AddAccountDialog } from '../components/AccountConnection';
import CloudIcon from '@mui/icons-material/Cloud';

const Home = () => {
  const { user } = useUser();
  const { account } = useAccount();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.username || 'User'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage your AWS accounts and resources
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Current account: {account?.name || 'No account selected'}
        </Typography>
      </Box>

      {/* AWS Accounts Section */}
      <Box 
        sx={{ 
          mb: 4, 
          background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
          color: 'white', 
          p: 3, 
          borderRadius: 2,
          boxShadow: 2,
          maxWidth: 800,
          width: '100%'
        }}
      >
        <Typography variant="h5" gutterBottom>
          AWS Accounts
        </Typography>
        <Typography variant="body1" paragraph>
          Connect and manage your AWS accounts to start monitoring your cloud resources.
        </Typography>
        <Button 
          variant="contained" 
          sx={{ 
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'grey.100'
            }
          }}
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Add AWS Account
        </Button>
      </Box>

      <AddAccountDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={async (connection) => {
          setIsAddDialogOpen(false);
          // Create the connection and return it
          try {
            const { createAwsConnection } = await import('../api/awsConnectionApi');
            return await createAwsConnection(connection);
          } catch (error) {
            console.error('Error creating connection:', error);
            // Re-throw to allow handling in the form
            throw error;
          }
        }}
      />
    </Box>
  );
};

export default Home; 