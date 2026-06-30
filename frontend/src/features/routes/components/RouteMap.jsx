import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { Box, Chip, Typography } from '@mui/material';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, fitBoundsToPoints } from '../../tracking/utils/mapUtils';
import { useGoogleMaps } from '../../../contexts/GoogleMapsProvider';
import GoogleRouteMap from '../../maps/components/GoogleRouteMap';
import GoogleDirectionsRouteMap from '../../maps/components/GoogleDirectionsRouteMap';
import { buildMapPoints } from '../utils/routeUtils';

const originIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#1565C0;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destinationIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#D32F2F;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const MapBounds = ({ points, markers = [] }) => {
  const map = useMap();
  useEffect(() => {
    const boundsPoints = [
      ...(points || []).map(([lat, lng]) => ({ lat, lng })),
      ...(markers || []).map((m) => ({ lat: m.lat, lng: m.lng })),
    ].filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    if (boundsPoints.length) {
      fitBoundsToPoints(map, boundsPoints);
    }
  }, [map, points, markers]);
  return null;
};

const ROUTE_PATH_OPTIONS = {
  highlight: { color: '#0D47A1', weight: 9, opacity: 0.25 },
  main: { color: '#1565C0', weight: 5, opacity: 0.95 },
};

const LeafletRouteMap = ({ path = [], markers = [], height = 320, visible = true }) => {
  const center = path[0] || (markers[0] ? [Number(markers[0].lat), Number(markers[0].lng)] : DEFAULT_MAP_CENTER);

  return (
    <Box
      sx={{
        height,
        borderRadius: 2,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        '& .leaflet-container': { height: '100%', width: '100%' },
      }}
    >
      <MapContainer
        key={visible ? 'route-map-visible' : 'route-map-hidden'}
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        scrollWheelZoom
        style={{ height: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds points={path} markers={markers} />

        {path.length > 1 && (
          <>
            <Polyline positions={path} pathOptions={ROUTE_PATH_OPTIONS.highlight} />
            <Polyline positions={path} pathOptions={ROUTE_PATH_OPTIONS.main} />
          </>
        )}

        {markers.map((marker, idx) => {
          if (marker.type === 'origin') {
            return (
              <Marker key={`origin-${idx}`} position={[marker.lat, marker.lng]} icon={originIcon}>
                <Popup>
                  <Typography variant="caption" fontWeight={700}>
                    Origin
                  </Typography>
                  <Typography variant="caption" display="block">
                    {marker.address || marker.label}
                  </Typography>
                </Popup>
              </Marker>
            );
          }
          if (marker.type === 'destination') {
            return (
              <Marker key={`dest-${idx}`} position={[marker.lat, marker.lng]} icon={destinationIcon}>
                <Popup>
                  <Typography variant="caption" fontWeight={700}>
                    Destination
                  </Typography>
                  <Typography variant="caption" display="block">
                    {marker.address || marker.label}
                  </Typography>
                </Popup>
              </Marker>
            );
          }
          return (
            <CircleMarker
              key={`stop-${marker.id || idx}`}
              center={[marker.lat, marker.lng]}
              radius={8}
              pathOptions={{ color: '#fff', weight: 2, fillColor: '#ED6C02', fillOpacity: 1 }}
            >
              <Popup>
                <Typography variant="caption" fontWeight={700}>
                  {marker.label}
                </Typography>
                {marker.stopType && (
                  <Chip label={marker.stopType} size="small" sx={{ mt: 0.5, textTransform: 'capitalize' }} />
                )}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </Box>
  );
};

const RouteMap = ({ route, path: pathProp, markers: markersProp, height = 320, visible = true }) => {
  const { isLoaded, hasApiKey } = useGoogleMaps();
  const built = useMemo(() => (route ? buildMapPoints(route) : null), [route]);
  const path = pathProp ?? built?.path ?? [];
  const markers = markersProp ?? built?.markers ?? [];

  if (route && hasApiKey && isLoaded) {
    return <GoogleDirectionsRouteMap route={route} height={height} visible={visible} />;
  }

  if (hasApiKey && isLoaded) {
    return <GoogleRouteMap path={path} markers={markers} height={height} visible={visible} />;
  }

  return <LeafletRouteMap path={path} markers={markers} height={height} visible={visible} />;
};

export default RouteMap;
