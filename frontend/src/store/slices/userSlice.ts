import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  _id: string;
  username: string;
  email: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
  avatarUrl?: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null
};

// Async thunk for refreshing user details
export const refreshUserDetails = createAsyncThunk(
  'user/refreshDetails',
  async (_, { rejectWithValue }) => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      return null;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      localStorage.removeItem('user_id');
      return rejectWithValue((error as Error).message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('user_id', action.payload._id);
      } else {
        localStorage.removeItem('user_id');
      }
    },
    clearUser: (state) => {
      state.user = null;
      localStorage.removeItem('user_id');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshUserDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshUserDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(refreshUserDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.user = null;
      });
  }
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer; 