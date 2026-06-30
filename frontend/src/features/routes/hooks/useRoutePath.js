import { useEffect, useMemo, useState } from 'react';
import { useGoogleMaps } from '../../../contexts/GoogleMapsProvider';
import {
  buildMapPoints,
  getDisplayStops,
  interpolateWaypointPath,
  normalizeLocation,
} from '../utils/routeUtils';

const isDetailedPath = (path, waypointCount) => path.length > Math.max(waypointCount + 5, 8);

export const useRoutePath = (route, enabled = true) => {
  const { isLoaded, hasApiKey } = useGoogleMaps();
  const { path: initialPath, markers, waypointPath } = useMemo(
    () => buildMapPoints(route),
    [route]
  );
  const [path, setPath] = useState(initialPath);

  useEffect(() => {
    setPath(initialPath);
  }, [initialPath]);

  useEffect(() => {
    if (!enabled || !route) return undefined;

    const origin = normalizeLocation(route.origin);
    const destination = normalizeLocation(route.destination);
    const stops = getDisplayStops(route).map(normalizeLocation).filter(Boolean);
    const waypointCount = (origin ? 1 : 0) + stops.length + (destination ? 1 : 0);
    const fallbackPath =
      waypointPath.length >= 2 ? interpolateWaypointPath(waypointPath) : initialPath;

    if (isDetailedPath(initialPath, waypointCount)) {
      setPath(initialPath);
      return undefined;
    }

    if (!origin || !destination) {
      setPath(fallbackPath);
      return undefined;
    }

    if (!hasApiKey || !isLoaded || !window.google?.maps?.DirectionsService) {
      setPath(fallbackPath);
      return undefined;
    }

    let cancelled = false;
    const service = new window.google.maps.DirectionsService();

    service.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints: stops.map((stop) => ({
          location: { lat: stop.lat, lng: stop.lng },
          stopover: true,
        })),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return;

        if (status === window.google.maps.DirectionsStatus.OK && result?.routes?.[0]) {
          const detailedPath = result.routes[0].overview_path
            .map((point) => [point.lat(), point.lng()])
            .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

          if (detailedPath.length >= 2) {
            setPath(detailedPath);
            return;
          }
        }

        setPath(fallbackPath);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [route, enabled, hasApiKey, isLoaded, initialPath, waypointPath]);

  return { path, markers };
};

export default useRoutePath;
