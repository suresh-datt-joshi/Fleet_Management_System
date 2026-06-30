import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Box, Chip, Typography } from '@mui/material';
import { createVehicleIcon, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, fitBoundsToPoints, isValidMapCoordinate } from '../utils/mapUtils';
import { useGoogleMaps } from '../../../contexts/GoogleMapsProvider';
import GoogleTrackingMap from '../../maps/components/GoogleTrackingMap';

const stopIcon = L.divIcon({
  className: '',
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#ff9800;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.35)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const companyIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;border-radius:50%;background:#1565C0;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700">HQ</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const MapBoundsUpdater = ({ vehicles, route, plannedPath, selectedVehicleId, companyLocation, hasActiveTrips }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedVehicleId && (route?.length || plannedPath?.length)) {
      fitBoundsToPoints(map, route?.length ? route : plannedPath);
      return;
    }
    if (hasActiveTrips && vehicles?.length) {
      const validLocations = vehicles
        .map((vehicle) => vehicle.location)
        .filter((location) => isValidMapCoordinate(location?.lat, location?.lng));
      if (validLocations.length) {
        fitBoundsToPoints(map, validLocations);
        return;
      }
    }
    if (!hasActiveTrips && isValidMapCoordinate(companyLocation?.lat, companyLocation?.lng)) {
      map.setView([companyLocation.lat, companyLocation.lng], DEFAULT_MAP_ZOOM);
    }
  }, [map, vehicles, route, plannedPath, selectedVehicleId, companyLocation, hasActiveTrips]);

  return null;
};

const MapClickHandler = ({ enabled, onMapClick }) => {
  useMapEvents({
    click(e) {
      if (enabled) {
        onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

const LeafletTrackingMap = ({
  vehicles = [],
  geofences = [],
  route = [],
  plannedPath = [],
  stopMarkers = [],
  selectedVehicleId,
  selectedVehicle,
  companyLocation = null,
  hasActiveTrips = false,
  geofencePlacementMode = false,
  onMapClick,
  height = 520,
}) => {
  const center = useMemo(() => {
    if (
      selectedVehicle?.location &&
      isValidMapCoordinate(selectedVehicle.location.lat, selectedVehicle.location.lng)
    ) {
      return [selectedVehicle.location.lat, selectedVehicle.location.lng];
    }
    if (hasActiveTrips) {
      const firstLocatedVehicle = vehicles.find((vehicle) =>
        isValidMapCoordinate(vehicle.location?.lat, vehicle.location?.lng)
      );
      if (firstLocatedVehicle) {
        return [firstLocatedVehicle.location.lat, firstLocatedVehicle.location.lng];
      }
    }
    if (isValidMapCoordinate(companyLocation?.lat, companyLocation?.lng)) {
      return [companyLocation.lat, companyLocation.lng];
    }
    return DEFAULT_MAP_CENTER;
  }, [selectedVehicle, vehicles, companyLocation, hasActiveTrips]);

  const routePositions = useMemo(() => route.map((p) => [p.lat, p.lng]), [route]);
  const plannedPositions = useMemo(() => plannedPath.map((p) => [p.lat, p.lng]), [plannedPath]);

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
      <MapContainer center={center} zoom={DEFAULT_MAP_ZOOM} scrollWheelZoom style={{ height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsUpdater
          vehicles={vehicles}
          route={route}
          plannedPath={plannedPath}
          selectedVehicleId={selectedVehicleId}
          companyLocation={companyLocation}
          hasActiveTrips={hasActiveTrips}
        />
        <MapClickHandler enabled={geofencePlacementMode} onMapClick={onMapClick} />

        {plannedPositions.length > 1 && (
          <Polyline
            positions={plannedPositions}
            pathOptions={{ color: '#9E9E9E', weight: 3, opacity: 0.8, dashArray: '8 8' }}
          />
        )}

        {routePositions.length > 1 && (
          <Polyline positions={routePositions} pathOptions={{ color: '#1565C0', weight: 4, opacity: 0.85 }} />
        )}

        {geofences.map((geofence) => {
          if (geofence.type === 'circle' && geofence.center) {
            return (
              <Circle
                key={geofence.id}
                center={[geofence.center.lat, geofence.center.lng]}
                radius={geofence.radius || 500}
                pathOptions={{
                  color: geofence.color || '#1565C0',
                  fillColor: geofence.color || '#1565C0',
                  fillOpacity: 0.15,
                }}
              />
            );
          }
          return null;
        })}

        {stopMarkers.map((stop) => (
          <Marker key={stop.id || `${stop.sequence}-${stop.name}`} position={[stop.lat, stop.lng]} icon={stopIcon}>
            <Popup>
              <Typography variant="subtitle2" fontWeight={700}>
                Stop {stop.sequence}: {stop.name}
              </Typography>
              <Typography variant="caption">{stop.address}</Typography>
            </Popup>
          </Marker>
        ))}

        {!hasActiveTrips && isValidMapCoordinate(companyLocation?.lat, companyLocation?.lng) && (
          <Marker position={[companyLocation.lat, companyLocation.lng]} icon={companyIcon}>
            <Popup>
              <Typography variant="subtitle2" fontWeight={700}>
                Company Location
              </Typography>
              {companyLocation.address && (
                <Typography variant="caption" display="block">
                  {companyLocation.address}
                </Typography>
              )}
            </Popup>
          </Marker>
        )}

        {vehicles.map((vehicle) => {
          if (!isValidMapCoordinate(vehicle.location?.lat, vehicle.location?.lng)) return null;
          const isSelected = vehicle.id === selectedVehicleId;
          return (
            <Marker
              key={vehicle.id}
              position={[vehicle.location.lat, vehicle.location.lng]}
              icon={createVehicleIcon(vehicle.ignition, vehicle.heading)}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Popup>
                <Typography variant="subtitle2" fontWeight={700}>
                  {vehicle.vehicleNumber}
                </Typography>
                <Typography variant="caption" display="block">
                  {vehicle.manufacturer} {vehicle.model}
                </Typography>
                {vehicle.activeTripNumber && (
                  <Typography variant="caption" display="block" color="primary">
                    Trip: {vehicle.activeTripNumber}
                  </Typography>
                )}
                <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                  <Chip label={`${Math.round(vehicle.speed)} km/h`} size="small" />
                  <Chip label={`${Math.round(vehicle.fuelLevel)}% fuel`} size="small" />
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
};

const LiveTrackingMap = (props) => {
  const { isLoaded, hasApiKey } = useGoogleMaps();

  if (hasApiKey && isLoaded) {
    return <GoogleTrackingMap {...props} />;
  }

  return <LeafletTrackingMap {...props} />;
};

export default LiveTrackingMap;
