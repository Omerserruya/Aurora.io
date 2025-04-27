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
      state.account = null;
      localStorage.removeItem('account_id');
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
      });
  }
});

export const { setAccount, clearAccount } = accountSlice.actions;
export default accountSlice.reducer; 