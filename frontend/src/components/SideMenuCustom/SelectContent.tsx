import * as React from 'react';
import MuiAvatar from '@mui/material/Avatar';
import MuiListItemAvatar from '@mui/material/ListItemAvatar';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import CloudIcon from '@mui/icons-material/Cloud';
import ListSubheader from '@mui/material/ListSubheader';
import Select, { SelectChangeEvent, selectClasses } from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { AddAccountDialog } from '../AccountConnection';
import { AWSConnection } from '../../types/awsConnection';
import { useAccount } from '../../hooks/compatibilityHooks';
import { fetchAwsConnections as fetchAwsConnectionsApi, createAwsConnection } from '../../api/awsConnectionApi';

const Avatar = styled(MuiAvatar)(({ theme }) => ({
  width: 28,
  height: 28,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,
  border: `1px solid ${theme.palette.divider}`,
}));

const ListItemAvatar = styled(MuiListItemAvatar)({
  minWidth: 0,
  marginRight: 12,
});

const saveAccountSelection = (accountId: string, accountName: string) => {
  try {
    sessionStorage.setItem('selected_account_id', accountId);
    sessionStorage.setItem('selected_account_name', accountName);
  } catch (error) {}
};

const getPersistedAccountId = () => {
  const fromLocalStorage = localStorage.getItem('account_id');
  const fromSessionStorage = sessionStorage.getItem('selected_account_id');
  return fromLocalStorage || fromSessionStorage || '';
};

const getPersistedAccountName = () => {
  return sessionStorage.getItem('selected_account_name') || 'Account';
};

export default function SelectContent() {
  const { account, setAccount, refreshAccountDetails } = useAccount();
  
  const persistedId = getPersistedAccountId();
  const persistedName = getPersistedAccountName();
  
  const [selectedAccount, setSelectedAccount] = React.useState<string>(persistedId);
  const [selectedAccountName, setSelectedAccountName] = React.useState<string>(persistedName);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [listAccounts, setListAccounts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = React.useState(false);
  
  React.useEffect(() => {
    const fetchData = async () => {
      await fetchAwsConnections();
      
      if (account && account._id) {
        setSelectedAccount(account._id);
        setSelectedAccountName(account.name);
        saveAccountSelection(account._id, account.name);
      } else {
        const persistedId = getPersistedAccountId();
        
        if (persistedId) {
          try {
            await refreshAccountDetails();
          } catch (error) {
            if (listAccounts.length > 0) {
              const persistedAccount = listAccounts.find(acc => acc.id === persistedId);
              if (persistedAccount) {
                setSelectedAccount(persistedId);
                setSelectedAccountName(persistedAccount.name);
                setAccount({
                  _id: persistedId,
                  name: persistedAccount.name
                });
              }
            }
          }
        }
      }
      
      setInitialLoadComplete(true);
    };
    
    fetchData();
  }, []);

  React.useEffect(() => {
    if (account && account._id) {
      setSelectedAccount(account._id);
      setSelectedAccountName(account.name);
      
      if (account.name) {
        saveAccountSelection(account._id, account.name);
      }
    }
  }, [account]);

  const fetchAwsConnections = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAwsConnectionsApi();
      
      if (Array.isArray(data)) {
        const formattedConnections = data.map((conn: any) => ({
          id: conn._id,
          name: conn.name,
          provider: conn.provider,
          region: conn.credentials.region,
          isValid: conn.isValidated
        }));
        setListAccounts(formattedConnections);
        
        const persistedId = getPersistedAccountId();
        if (persistedId && !account) {
          const persistedAccount = formattedConnections.find(acc => acc.id === persistedId);
          if (persistedAccount) {
            setSelectedAccount(persistedId);
            setSelectedAccountName(persistedAccount.name);
            setAccount({
              _id: persistedId,
              name: persistedAccount.name
            });
          }
        }
      } else if (data && typeof data === 'object') {
        const connections = data.connections || data.results || data.items || data.data || [];
        
        if (Array.isArray(connections)) {
          const formattedConnections = connections.map((conn: any) => ({
            id: conn._id,
            name: conn.name,
            provider: conn.provider,
            region: conn.credentials.region,
            isValid: conn.isValidated
          }));
          setListAccounts(formattedConnections);
          
          const persistedId = getPersistedAccountId();
          if (persistedId && !account) {
            const persistedAccount = formattedConnections.find(acc => acc.id === persistedId);
            if (persistedAccount) {
              setSelectedAccount(persistedId);
              setSelectedAccountName(persistedAccount.name);
              setAccount({
                _id: persistedId,
                name: persistedAccount.name
              });
            }
          }
        } else {
          setListAccounts([]);
        }
      } else {
        setListAccounts([]);
      }
    } catch (error) {
      setListAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    if (value === 'new') {
      setIsAddDialogOpen(true);
    } else {
      setSelectedAccount(value);
      
      const selectedAccountObj = listAccounts.find(acc => acc.id === value);
      if (selectedAccountObj) {
        setSelectedAccountName(selectedAccountObj.name);
        
        setAccount({
          _id: selectedAccountObj.id,
          name: selectedAccountObj.name
        });
        
        saveAccountSelection(selectedAccountObj.id, selectedAccountObj.name);
      }
    }
  };

  const handleAddAccount = async (connection: AWSConnection) => {
    try {
      const data = await createAwsConnection(connection);
      
      await fetchAwsConnections();
      
      if (data && data._id) {
        setSelectedAccount(data._id);
        setSelectedAccountName(data.name);
        setAccount({
          _id: data._id,
          name: data.name
        });
        
        saveAccountSelection(data._id, data.name);
      }
      
      setIsAddDialogOpen(false);
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  const renderValue = (selected: string) => {
    if (!selected) {
      return <Box sx={{ color: 'text.secondary' }}>Select Account</Box>;
    }
    
    if (!initialLoadComplete) {
      return selectedAccountName;
    }
    
    const account = listAccounts.find(acc => acc.id === selected);
    return account ? account.name : selectedAccountName;
  };

  return (
    <>
      <Box 
        display="flex" 
        justifyContent="center" 
        width="100%" 
        px={2}
      >
        <Select
          labelId="account-select"
          id="account-simple-select"
          value={selectedAccount}
          onChange={handleChange}
          displayEmpty
          renderValue={renderValue}
          sx={{
            maxHeight: 56,
            width: 215,
            margin: '0 auto',
            '& .MuiList-root': {
              p: '8px',
            },
            [`& .${selectClasses.select}`]: {
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              pl: 1,
            },
          }}
        >
          <ListSubheader sx={{ pt: 0 }}>Accounts</ListSubheader>
          {isLoading ? (
            <MenuItem disabled>
              <Box display="flex" alignItems="center" justifyContent="center" width="100%" py={1}>
                <CircularProgress size={24} />
              </Box>
            </MenuItem>
          ) : listAccounts.length > 0 ? (
            listAccounts.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                <ListItemAvatar>
                  <Avatar alt={item.name}>
                    <CloudIcon color={item.isValid ? "primary" : "disabled"} sx={{ fontSize: '1rem' }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={item.name} 
                  secondary={`${item.provider.toUpperCase()} - ${item.region}`} 
                />
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <ListItemText primary="No accounts found" />
            </MenuItem>
          )}

          <Divider sx={{ mx: -1 }} />
          <MenuItem value="new">
            <ListItemIcon>
              <AddRoundedIcon />
            </ListItemIcon>
            <ListItemText primary="Add Account" secondary="Create New" />
          </MenuItem>
        </Select>
      </Box>

      <AddAccountDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddAccount}
      />
    </>
  );
}
