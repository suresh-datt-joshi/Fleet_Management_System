import { useSelector } from 'react-redux';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsInitialized,
  selectUserPermissions,
} from '../redux/slices/authSlice';

export const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const permissions = useSelector(selectUserPermissions);

  return { user, isAuthenticated, isInitialized, permissions };
};

export default useAuth;
