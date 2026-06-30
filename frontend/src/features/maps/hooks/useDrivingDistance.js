import { useEffect, useState } from 'react';
import { useGoogleMaps } from '../../../contexts/GoogleMapsProvider';

const parseCoord = (value) => {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const useDrivingDistance = (origin, destination, enabled = true) => {
  const { isLoaded, hasApiKey } = useGoogleMaps();
  const [distanceKm, setDistanceKm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDistanceKm(null);
      setLoading(false);
      return undefined;
    }

    const originLat = parseCoord(origin?.lat);
    const originLng = parseCoord(origin?.lng);
    const destinationLat = parseCoord(destination?.lat);
    const destinationLng = parseCoord(destination?.lng);

    if (originLat == null || originLng == null || destinationLat == null || destinationLng == null) {
      setDistanceKm(null);
      setLoading(false);
      return undefined;
    }

    if (!hasApiKey || !isLoaded || !window.google?.maps?.DirectionsService) {
      setDistanceKm(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destinationLat, lng: destinationLng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return;
        setLoading(false);

        if (status === window.google.maps.DirectionsStatus.OK && result?.routes?.[0]) {
          const meters = (result.routes[0].legs || []).reduce(
            (sum, leg) => sum + (leg.distance?.value || 0),
            0
          );
          setDistanceKm(Math.round((meters / 1000) * 100) / 100);
          return;
        }

        setDistanceKm(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, enabled, hasApiKey, isLoaded]);

  return { distanceKm, loading };
};

export default useDrivingDistance;
