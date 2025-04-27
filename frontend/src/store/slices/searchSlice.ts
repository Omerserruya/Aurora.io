import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SearchState {
  searchQuery: string;
  isSearchOpen: boolean;
}

const initialState: SearchState = {
  searchQuery: '',
  isSearchOpen: false
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setIsSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchOpen = action.payload;
    }
  }
});

export const { setSearchQuery, setIsSearchOpen } = searchSlice.actions;
export default searchSlice.reducer; 