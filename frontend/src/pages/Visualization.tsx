import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import { Refresh as RefreshIcon, Sync as SyncIcon } from '@mui/icons-material';
import AWSArchitectureVisualizer, { AWSArchitecture } from '../components/aws-architecture-visualizer';
import axios from 'axios';
import { useAccount } from '../hooks/compatibilityHooks';
import { executeCloudQuery } from '../api/awsConnectionApi';
import { useUser } from '../hooks/compatibilityHooks';

function Visualization() {
  const [data, setData] = useState<AWSArchitecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastPolled, setLastPolled] = useState<number>(0);
  const { account } = useAccount();
  const { user } = useUser();

  const fetchData = async () => {
    if (!account?._id) {
      setError('No AWS connection selected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching data for connectionId:', account._id);
      const url = `/api/db/neo/cloud-query-results/${account._id}`;
      console.log('Request URL:', url);
      
      const response = await axios.get(url, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Response received:', response.data);
      
      // Check if we received meaningful data
      if (response.data && Object.keys(response.data).length > 0) {
        setData(response.data);
        setError(null);
        setSyncing(false);
        setSyncStatus(null);
      } else {
        // No data yet - this could be a new connection with sync in progress
        setData(null);
        setError(null);
        
        // Keep the syncing state active if we're coming from the side menu
        if (!syncStatus) {
          setSyncStatus('Cloud query in progress. Checking for results...');
        }
      }
    } catch (err) {
      console.error('Detailed error:', err);
      setError('Failed to fetch infrastructure data');
    } finally {
      setLoading(false);
      // Record when we last polled for data
      setLastPolled(Date.now());
    }
  };

  const startPolling = () => {
    console.log("Starting polling for updates...");
    // Set up polling to check for data updates
    let pollingAttempts = 0;
    const maxPollingAttempts = 8; // Increase max attempts to give more time for sync to complete
    
    const pollForUpdates = async () => {
      if (!account?._id) return;
      
      try {
        console.log(`Polling for data updates (attempt ${pollingAttempts + 1}/${maxPollingAttempts})...`);
        const response = await axios.get(`/api/db/neo/cloud-query-results/${account._id}`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        // Check if we got actual data
        if (response.data && Object.keys(response.data).length > 0) {
          // If we have data, update state and stop polling
          setData(response.data);
          setSyncStatus('Data successfully synchronized');
          setSyncing(false);
          return;
        }
        
        // If we've reached max attempts, stop polling but inform user
        if (++pollingAttempts >= maxPollingAttempts) {
          setSyncStatus('Cloud query still in progress. Please sync again or refresh in a few minutes.');
          setSyncing(false);
          return;
        }
        
        // Continue polling with exponential backoff
        // Keep syncing visual indicator active between polls
        setSyncing(true);
        if (!syncStatus || syncStatus === 'Checking for cloud query results...') {
          setSyncStatus('Syncing with AWS. This may take several minutes...');
        }
        
        // Shorter initial intervals, then exponential backoff
        const delay = pollingAttempts <= 2 ? 2000 : 3000 * Math.pow(1.5, pollingAttempts - 2);
        setTimeout(pollForUpdates, delay);
      } catch (err) {
        console.error('Polling error:', err);
        setSyncStatus('Query in progress. Please refresh manually to see results.');
        setSyncing(false);
      }
    };
    
    // Start polling immediately
    pollForUpdates();
  };

  const handleSync = async () => {
    if (!account?._id) {
      setError('No AWS connection selected');
      return;
    }

    try {
      setSyncing(true);
      setSyncStatus('Starting cloud query...');
      setError(null);
      console.log('Executing cloud query for connection:', account._id);
      
      // Log the URL we're calling for debugging
      console.log(`Calling: /api/cloud/query/${account._id}`);
      
      const result = await executeCloudQuery(account._id);
      console.log('Cloud query result:', result);
      
      if (result.success) {
        setSyncStatus('Cloud query started successfully. This may take several minutes.');
        
        // Try an immediate fetch in case data is already available 
        // (though this is unlikely right after starting a sync)
        await fetchData();
        
        // Always keep syncing indicator visible when a sync is initiated manually
        setSyncing(true);
        
        // Start polling with a more aggressive interval for manual syncs
        startPolling();
      } else {
        setError(`Failed to sync: ${result.message}`);
        setSyncStatus(null);
        setSyncing(false);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError('Failed to sync with AWS');
      setSyncStatus(null);
      setSyncing(false);
    }
  };

  // Initial data fetch when component mounts or account changes
  useEffect(() => {
    // Just fetch data when account changes, don't sync
    fetchData();
    
    // Clear any previous sync status when changing accounts
    if (syncStatus) {
      setSyncStatus(null);
    }
    if (syncing) {
      setSyncing(false);
    }
  }, [account?._id]);

  // Separate effect to detect if we should check for sync results
  useEffect(() => {
    // Only start polling if:
    // 1. We have an account selected
    // 2. We've tried to fetch data (lastPolled > 0)
    // 3. We don't have data yet
    // 4. We're not already syncing
    // 5. There's no error showing
    if (account?._id && lastPolled > 0 && !data && !syncing && !error) {
      // This is likely a new account that's still being synced
      // Start polling for results with a delay
      const timer = setTimeout(() => {
        console.log("No data available after fetch, starting polling for new account sync...");
        setSyncing(true);
        setSyncStatus('Checking for cloud query results...');
        startPolling();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [account?._id, lastPolled, data, syncing, error]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh data">
                <IconButton color="inherit" size="small" onClick={fetchData}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Sync with AWS">
                <IconButton color="inherit" size="small" onClick={handleSync} disabled={syncing}>
                  <SyncIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        >
          {error}
        </Alert>
        {syncStatus && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {syncStatus}
          </Alert>
        )}
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="info" 
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh data">
                <IconButton color="inherit" size="small" onClick={fetchData}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Sync with AWS">
                <IconButton color="inherit" size="small" onClick={handleSync} disabled={syncing}>
                  <SyncIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        >
          {syncing ? 'Syncing data from AWS...' : 'No data available'}
        </Alert>
        {syncStatus && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {syncStatus}
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, height: '100%', width: '100%', position: 'relative' }}>
      <Box sx={{ 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        zIndex: 1000,
        display: 'flex',
        gap: 1,
        bgcolor: 'background.paper',
        borderRadius: 1,
        padding: 0.5,
        boxShadow: 1
      }}>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={fetchData}
            disabled={loading}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Sync with AWS">
          <IconButton 
            onClick={handleSync}
            disabled={syncing}
            size="small"
            color="primary"
          >
            <SyncIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* Status message */}
      {syncStatus && (
        <Alert 
          severity="info" 
          sx={{ 
            position: 'absolute', 
            top: 70, 
            right: 16, 
            zIndex: 1000,
            maxWidth: '300px'
          }}
        >
          {syncStatus}
        </Alert>
      )}
      
      {/* Syncing indicator */}
      {syncing && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'background.paper',
          p: 3,
          borderRadius: 2,
          boxShadow: 3
        }}>
          <CircularProgress />
          <Typography>Syncing with AWS...</Typography>
        </Box>
      )}
      
      <AWSArchitectureVisualizer data={data} />
    </Box>
  );
}

export default Visualization; 