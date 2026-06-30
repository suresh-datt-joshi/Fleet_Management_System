import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { GoogleMap } from '@react-google-maps/api';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../utils/mapConstants';
import { getDisplayStops, normalizeLocation } from '../../routes/utils/routeUtils';

const TRAFFIC_COLORS = {
  clear: '#34A853',
  moderate: '#FBBC04',
  heavy: '#EA4335',
  unknown: '#4285F4',
};

const toDirectionsLocation = (location) => {
  if (!location) return null;
  const normalized = normalizeLocation(location);
  if (normalized) return { lat: normalized.lat, lng: normalized.lng };
  if (location.address?.trim()) return location.address.trim();
  return null;
};

const buildRouteKey = (route) => {
  if (!route) return '';
  const stops = getDisplayStops(route);
  return JSON.stringify({
    id: route.id,
    origin: toDirectionsLocation(route.origin),
    destination: toDirectionsLocation(route.destination),
    stops: stops.map((stop) => toDirectionsLocation(stop)),
    optimizedAt: route.optimizedAt || null,
  });
};

const getLegTrafficColor = (leg) => {
  const duration = leg?.duration?.value;
  const durationInTraffic = leg?.duration_in_traffic?.value;
  if (!duration || !durationInTraffic) return TRAFFIC_COLORS.unknown;

  const delayRatio = durationInTraffic / duration;
  if (delayRatio <= 1.08) return TRAFFIC_COLORS.clear;
  if (delayRatio <= 1.25) return TRAFFIC_COLORS.moderate;
  return TRAFFIC_COLORS.heavy;
};

const clearTrafficPolylines = (polylinesRef) => {
  polylinesRef.current.forEach((polyline) => polyline.setMap(null));
  polylinesRef.current = [];
};

const drawTrafficPolylines = (map, directionsResult, polylinesRef) => {
  clearTrafficPolylines(polylinesRef);

  const routeResult = directionsResult?.routes?.[0];
  const encoding = window.google?.maps?.geometry?.encoding;
  if (!map || !routeResult?.legs || !encoding) return false;

  routeResult.legs.forEach((leg) => {
    const color = getLegTrafficColor(leg);
    leg.steps?.forEach((step) => {
      if (!step.polyline?.points) return;
      const path = encoding.decodePath(step.polyline.points);
      polylinesRef.current.push(
        new window.google.maps.Polyline({
          path,
          strokeColor: color,
          strokeWeight: 6,
          strokeOpacity: 0.95,
          zIndex: 200,
          map,
        })
      );
    });
  });

  return polylinesRef.current.length > 0;
};

const TrafficLegend = () => (
  <Box
    sx={{
      position: 'absolute',
      bottom: 8,
      left: 8,
      zIndex: 3,
      px: 1.25,
      py: 0.75,
      borderRadius: 1,
      bgcolor: 'background.paper',
      boxShadow: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 0.35,
    }}
  >
    <Typography variant="caption" fontWeight={700} color="text.secondary">
      Route traffic
    </Typography>
    {[
      { color: TRAFFIC_COLORS.clear, label: 'Clear' },
      { color: TRAFFIC_COLORS.moderate, label: 'Moderate' },
      { color: TRAFFIC_COLORS.heavy, label: 'Heavy' },
    ].map((item) => (
      <Box key={item.label} display="flex" alignItems="center" gap={0.75}>
        <Box sx={{ width: 18, height: 4, borderRadius: 1, bgcolor: item.color }} />
        <Typography variant="caption">{item.label}</Typography>
      </Box>
    ))}
  </Box>
);

const GoogleDirectionsRouteMap = ({ route, height = 320, visible = true }) => {
  const mapRef = useRef(null);
  const rendererRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const trafficPolylinesRef = useRef([]);
  const requestIdRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLiveTraffic, setHasLiveTraffic] = useState(false);

  const routeKey = useMemo(() => buildRouteKey(route), [route]);
  const mapContainerStyle = useMemo(
    () => ({ width: '100%', height: `${height}px` }),
    [height]
  );

  const attachLayersToMap = useCallback((map) => {
    if (!map || !window.google?.maps) return;

    if (!rendererRef.current) {
      rendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
        suppressPolylines: true,
        preserveViewport: false,
      });
    }
    rendererRef.current.setMap(map);

    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new window.google.maps.TrafficLayer();
    }
    trafficLayerRef.current.setMap(map);
  }, []);

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      attachLayersToMap(map);
      setMapReady(true);
    },
    [attachLayersToMap]
  );

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
    setMapReady(false);
  }, []);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      clearTrafficPolylines(trafficPolylinesRef);
      if (rendererRef.current) {
        rendererRef.current.setMap(null);
        rendererRef.current = null;
      }
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
        trafficLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    if (!routeKey || !mapReady || !mapRef.current || !window.google?.maps?.DirectionsService) {
      return undefined;
    }

    let parsed;
    try {
      parsed = JSON.parse(routeKey);
    } catch {
      setLoading(false);
      setError('Invalid route data.');
      return undefined;
    }

    const { origin, destination, stops = [] } = parsed;
    if (!origin || !destination) {
      setLoading(false);
      setError('Add origin and destination coordinates or addresses to display the route.');
      return undefined;
    }

    attachLayersToMap(mapRef.current);

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const service = new window.google.maps.DirectionsService();
    setLoading(true);
    setError(null);

    const request = {
      origin,
      destination,
      waypoints: stops.map((location) => ({ location, stopover: true })),
      optimizeWaypoints: false,
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    const applyDirections = (result, liveTraffic = false) => {
      if (requestId !== requestIdRef.current || !rendererRef.current || !mapRef.current) return;

      rendererRef.current.setDirections(result);
      const drewTrafficPath = drawTrafficPolylines(mapRef.current, result, trafficPolylinesRef);
      setHasLiveTraffic(liveTraffic && drewTrafficPath);
      setLoading(false);
      setError(null);

      window.setTimeout(() => {
        if (!mapRef.current) return;
        window.google.maps.event.trigger(mapRef.current, 'resize');
        const bounds = result.routes?.[0]?.bounds;
        if (bounds) {
          mapRef.current.fitBounds(bounds, 48);
        }
      }, 250);
    };

    service.route(
      {
        ...request,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
        },
      },
      (result, status) => {
        if (requestId !== requestIdRef.current) return;

        if (status === window.google.maps.DirectionsStatus.OK && result) {
          applyDirections(result, true);
          return;
        }

        service.route(request, (fallbackResult, fallbackStatus) => {
          if (requestId !== requestIdRef.current) return;

          if (fallbackStatus === window.google.maps.DirectionsStatus.OK && fallbackResult) {
            applyDirections(fallbackResult, false);
            return;
          }

          setHasLiveTraffic(false);
          setLoading(false);
          setError('Could not load driving directions for this route.');
        });
      }
    );

    const resizeTimer = window.setTimeout(() => {
      if (mapRef.current) {
        window.google.maps.event.trigger(mapRef.current, 'resize');
      }
    }, 400);

    return () => {
      window.clearTimeout(resizeTimer);
      requestIdRef.current += 1;
      clearTrafficPolylines(trafficPolylinesRef);
    };
  }, [routeKey, visible, mapReady, attachLayersToMap]);

  return (
    <Box
      sx={{
        position: 'relative',
        height,
        borderRadius: 2,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.65)',
            pointerEvents: 'none',
          }}
        >
          <CircularProgress size={28} />
        </Box>
      )}
      {error && !loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            zIndex: 2,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: 'background.paper',
            boxShadow: 1,
          }}
        >
          <Typography variant="caption" color="error.main">
            {error}
          </Typography>
        </Box>
      )}
      {!loading && !error && hasLiveTraffic && <TrafficLegend />}
      <GoogleMap
        key={route?.id || 'route-directions-map'}
        mapContainerStyle={mapContainerStyle}
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      />
    </Box>
  );
};

export default GoogleDirectionsRouteMap;
