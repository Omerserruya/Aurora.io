import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setAccount, clearAccount, refreshAccountDetails } from '../store/slices/accountSlice';
import type { Account } from '../store/slices/accountSlice';

export const useReduxAccount = () => {
  const { account, loading, error } = useAppSelector((state) => state.account);
  const dispatch = useAppDispatch();

  return {
    account,
    loading,
    error,
    setAccount: (account: Account | null) => dispatch(setAccount(account)),
    clearAccount: () => dispatch(clearAccount()),
    refreshAccountDetails: () => dispatch(refreshAccountDetails())
  };
}; 