import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAP_CONTAINER_STYLE } from '../utils/mapConstants';

const markerColors = {
  origin: '#2e7d32',
  destination: '#c62828',
  stop: '#ed6c02',
};

const ROUTE_PATH_OPTIONS = {
  highlight: { strokeColor: '#0D47A1', strokeWeight: 10, strokeOpacity: 0.35, zIndex: 1 },
  main: { strokeColor: '#1565C0', strokeWeight: 6, strokeOpacity: 1, zIndex: 2 },
};

const toLatLngPoint = (point) => {
  if (Array.isArray(point)) {
    return { lat: Number(point[0]), lng: Number(point[1]) };
  }
  return { lat: Number(point.lat), lng: Number(point.lng) };
};

const GoogleRouteMap = ({ path = [], markers = [], height = 320, visible = true }) => {
  const mapRef = useRef(null);

  const routePath = useMemo(
    () =>
      path
        .map(toLatLngPoint)
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng)),
    [path]
  );

  const center = useMemo(() => {
    if (routePath[0]) return routePath[0];
    if (markers[0]) return { lat: Number(markers[0].lat), lng: Number(markers[0].lng) };
    return DEFAULT_MAP_CENTER;
  }, [routePath, markers]);

  const fitMapToRoute = useCallback(() => {
    if (!mapRef.current) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    routePath.forEach((point) => {
      bounds.extend(point);
      hasPoints = true;
    });

    markers.forEach((marker) => {
      const lat = Number(marker.lat);
      const lng = Number(marker.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        bounds.extend({ lat, lng });
        hasPoints = true;
      }
    });

    if (hasPoints && !bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 56);
    }
  }, [routePath, markers]);

  useEffect(() => {
    if (!visible || !mapRef.current) return undefined;

    const timer = window.setTimeout(() => {
      window.google?.maps?.event?.trigger(mapRef.current, 'resize');
      fitMapToRoute();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [visible, fitMapToRoute, routePath.length]);

  return (
    <Box
      sx={{
        height,
        borderRadius: 2,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <GoogleMap
        mapContainerStyle={{ ...MAP_CONTAINER_STYLE, height: `${height}px` }}
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        onLoad={(map) => {
          mapRef.current = map;
          fitMapToRoute();
        }}
        options={{ streetViewControl: false, mapTypeControl: false }}
      >
        {routePath.length > 1 && (
          <>
            <Polyline path={routePath} options={ROUTE_PATH_OPTIONS.highlight} />
            <Polyline path={routePath} options={ROUTE_PATH_OPTIONS.main} />
          </>
        )}

        {markers.map((marker, idx) => {
          const lat = Number(marker.lat);
          const lng = Number(marker.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

          const color = markerColors[marker.type] || markerColors.stop;
          return (
            <Marker
              key={`${marker.type}-${marker.id || idx}`}
              position={{ lat, lng }}
              label={
                marker.type === 'stop' && marker.stopNumber
                  ? { text: String(marker.stopNumber), color: '#fff', fontWeight: '700' }
                  : undefined
              }
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
                scale: marker.type === 'stop' ? 9 : 10,
              }}
              title={marker.label}
            />
          );
        })}
      </GoogleMap>
    </Box>
  );
};

export default GoogleRouteMap;
