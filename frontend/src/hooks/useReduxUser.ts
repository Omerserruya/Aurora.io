import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setUser, clearUser, refreshUserDetails } from '../store/slices/userSlice';
import type { User } from '../store/slices/userSlice';

export const useReduxUser = () => {
  const { user, loading, error } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  return {
    user,
    loading,
    error,
    setUser: (user: User | null) => dispatch(setUser(user)),
    clearUser: () => dispatch(clearUser()),
    refreshUserDetails: () => dispatch(refreshUserDetails())
  };
}; 