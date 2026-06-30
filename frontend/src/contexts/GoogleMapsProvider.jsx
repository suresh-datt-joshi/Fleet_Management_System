import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { API_BASE_URL } from '../constants';
import { GOOGLE_MAP_LIBRARIES } from '../features/maps/utils/mapConstants';

const PLACEHOLDER_KEY = 'your-google-maps-api-key';

const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: null,
  hasApiKey: false,
});

const isValidApiKey = (key) => Boolean(key && key !== PLACEHOLDER_KEY);

const GoogleMapsLoader = ({ apiKey, children }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAP_LIBRARIES,
    id: 'fleet-google-maps',
  });

  const value = useMemo(
    () => ({
      isLoaded,
      loadError,
      hasApiKey: true,
    }),
    [isLoaded, loadError]
  );

  return <GoogleMapsContext.Provider value={value}>{children}</GoogleMapsContext.Provider>;
};

export const GoogleMapsProvider = ({ children }) => {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [apiKey, setApiKey] = useState(isValidApiKey(envKey) ? envKey : '');
  const [resolvingKey, setResolvingKey] = useState(!isValidApiKey(envKey));

  useEffect(() => {
    if (isValidApiKey(envKey)) {
      setApiKey(envKey);
      setResolvingKey(false);
      return;
    }

    let cancelled = false;

    const loadBrowserConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/maps/browser-config`);
        const payload = await response.json();
        const backendKey = payload?.data?.apiKey;

        if (!cancelled && isValidApiKey(backendKey)) {
          setApiKey(backendKey);
        }
      } catch {
        // Maps will fall back to Leaflet when no key is available.
      } finally {
        if (!cancelled) {
          setResolvingKey(false);
        }
      }
    };

    loadBrowserConfig();

    return () => {
      cancelled = true;
    };
  }, [envKey]);

  if (resolvingKey) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: null, hasApiKey: false }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  if (!isValidApiKey(apiKey)) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: null, hasApiKey: false }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return <GoogleMapsLoader apiKey={apiKey}>{children}</GoogleMapsLoader>;
};

export const useGoogleMaps = () => useContext(GoogleMapsContext);

export default GoogleMapsProvider;
