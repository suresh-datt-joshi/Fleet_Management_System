import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getAccessToken } from '../../utils/tokenStorage';
import { dismissHtmlSplash } from '../../utils/appSplash';
import { useLazyGetMeQuery } from '../../redux/api/authApi';
import { setCredentials, setInitialized, logout } from '../../redux/slices/authSlice';
import SplashScreen from './SplashScreen';

const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const [getMe] = useLazyGetMeQuery();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    dismissHtmlSplash();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const result = await getMe().unwrap();
          dispatch(setCredentials({ user: result.data.user, accessToken: token }));
        } catch {
          dispatch(logout());
        }
      } else {
        dispatch(setInitialized());
      }
      setChecking(false);
    };

    initAuth();
  }, [dispatch, getMe]);

  if (checking) {
    return <SplashScreen variant="boot" />;
  }

  return children;
};

export default AuthInitializer;
