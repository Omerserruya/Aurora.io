import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import userReducer from './slices/userSlice';
import accountReducer from './slices/accountSlice';
import searchReducer from './slices/searchSlice';

// Define the root state type
export type RootState = ReturnType<typeof rootReducer>;

// Define the persistConfig
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'], // Only persist user state
};

const rootReducer = combineReducers({
  user: userReducer,
  account: accountReducer,
  search: searchReducer,
});

// Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore all redux-persist actions to avoid non-serializable warnings
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Define the AppDispatch type
export type AppDispatch = typeof store.dispatch; 