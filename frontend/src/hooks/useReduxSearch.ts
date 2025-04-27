import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setSearchQuery, setIsSearchOpen } from '../store/slices/searchSlice';

export const useReduxSearch = () => {
  const { searchQuery, isSearchOpen } = useAppSelector((state) => state.search);
  const dispatch = useAppDispatch();

  return {
    searchQuery,
    isSearchOpen,
    setSearchQuery: (query: string) => dispatch(setSearchQuery(query)),
    setIsSearchOpen: (isOpen: boolean) => dispatch(setIsSearchOpen(isOpen))
  };
}; 