import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Account {
  _id: string;
  name: string;
}

interface AccountState {
  account: Account | null;
  loading: boolean;
  error: string | null;
}

const initialState: AccountState = {
  account: null,
  loading: false,
  error: null
};

// Helper function to clear user-specific account selection
const clearUserSpecificData = (userId: string | null) => {
  if (!userId) {
    // If no user ID, just remove the base keys
    localStorage.removeItem('account_id');
    return;
  }
  
  // Remove user-specific account selection
  localStorage.removeItem(`selected_account_id_${userId}`);
  localStorage.removeItem(`selected_account_name_${userId}`);
  localStorage.removeItem('account_id');
};

// Helper function to get user-specific account ID
const getUserSpecificAccountId = (userId: string) => {
  if (!userId) return null;
  return localStorage.getItem(`selected_account_id_${userId}`);
};

// Helper function to get user-specific account name
const getUserSpecificAccountName = (userId: string) => {
  if (!userId) return null;
  return localStorage.getItem(`selected_account_name_${userId}`);
};

// New async thunk for initializing account from user-specific localStorage
export const initializeAccountFromStorage = createAsyncThunk(
  'account/initializeFromStorage',
  async (userId: string, { rejectWithValue }) => {
    if (!userId) {
      return null;
    }

    const accountId = getUserSpecificAccountId(userId);
    const accountName = getUserSpecificAccountName(userId);
    
    if (!accountId || !accountName) {
      return null;
    }

    try {
      // Try to fetch fresh account details from the server
      const response = await fetch(`/api/accounts/${accountId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        // If server call fails, but we have local data, use local data
        console.warn('Failed to fetch account details from server, using cached data');
        return {
          _id: accountId,
          name: accountName
        };
      }

      // Check if the response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If response is invalid, use cached data
        return {
          _id: accountId,
          name: accountName
        };
      }

      const accountData = await response.json();
      
      // Update localStorage with fresh data
      if (accountData && accountData._id) {
        localStorage.setItem('account_id', accountData._id);
        localStorage.setItem(`selected_account_id_${userId}`, accountData._id);
        localStorage.setItem(`selected_account_name_${userId}`, accountData.name);
      }
      
      return accountData;
    } catch (error) {
      // If server call fails, but we have local data, use local data
      console.warn('Error fetching account details, using cached data:', error);
      return {
        _id: accountId,
        name: accountName
      };
    }
  }
);

// Async thunk for refreshing account details
export const refreshAccountDetails = createAsyncThunk(
  'account/refreshDetails',
  async (_, { rejectWithValue }) => {
    const accountId = localStorage.getItem('account_id');
    if (!accountId) {
      return null;
    }

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        if (response.status !== 401 && response.status !== 403) {
          localStorage.removeItem('account_id');
        }
        
        return rejectWithValue(`API error: ${response.status} ${response.statusText}`);
      }

      // Check if the response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return rejectWithValue('Invalid response format - expected JSON');
      }

      const accountData = await response.json();
      // Ensure the account data is stored in localStorage
      if (accountData && accountData._id) {
        localStorage.setItem('account_id', accountData._id);
      }
      
      return accountData;
    } catch (error) {
      // Only remove the account_id in specific error cases
      if ((error as Error).message.includes('Failed to fetch') || 
          (error as Error).message.includes('NetworkError')) {
        // Keep account_id in localStorage for network errors
      } else {
        localStorage.removeItem('account_id');
      }
      
      return rejectWithValue((error as Error).message);
    }
  }
);

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAccount: (state, action: PayloadAction<Account | null>) => {
      state.account = action.payload;
      if (action.payload) {
        localStorage.setItem('account_id', action.payload._id);
      } else {
        localStorage.removeItem('account_id');
      }
    },
    clearAccount: (state) => {
      const userId = localStorage.getItem('user_id');
      state.account = null;
      state.loading = false;
      state.error = null;
      clearUserSpecificData(userId);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshAccountDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshAccountDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.account = action.payload;
      })
      .addCase(refreshAccountDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(initializeAccountFromStorage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAccountFromStorage.fulfilled, (state, action) => {
        state.loading = false;
        state.account = action.payload;
      })
      .addCase(initializeAccountFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setAccount, clearAccount } = accountSlice.actions;
export default accountSlice.reducer; 