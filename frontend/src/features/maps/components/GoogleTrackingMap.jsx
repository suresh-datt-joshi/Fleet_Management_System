import { useEffect, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import { GoogleMap, Marker, Polyline, Circle } from '@react-google-maps/api';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAP_CONTAINER_STYLE } from '../utils/mapConstants';

const vehicleIcon = (ignition, heading = 0) => ({
  path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW || 0,
  fillColor: ignition ? '#2e7d32' : '#757575',
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2,
  scale: 5,
  rotation: heading,
});

const stopIcon = {
  path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
  fillColor: '#ff9800',
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2,
  scale: 6,
};

const GoogleTrackingMap = ({
  vehicles = [],
  geofences = [],
  route = [],
  plannedPath = [],
  stopMarkers = [],
  selectedVehicleId,
  selectedVehicle,
  geofencePlacementMode = false,
  onMapClick,
  height = 520,
}) => {
  const mapRef = useRef(null);

  const center = useMemo(() => {
    if (selectedVehicle?.location) {
      return { lat: selectedVehicle.location.lat, lng: selectedVehicle.location.lng };
    }
    if (vehicles[0]?.location) {
      return { lat: vehicles[0].location.lat, lng: vehicles[0].location.lng };
    }
    return DEFAULT_MAP_CENTER;
  }, [selectedVehicle, vehicles]);

  const routePath = useMemo(() => route.map((p) => ({ lat: p.lat, lng: p.lng })), [route]);
  const plannedRoutePath = useMemo(
    () => plannedPath.map((p) => ({ lat: p.lat, lng: p.lng })),
    [plannedPath]
  );

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    const bounds = new window.google.maps.LatLngBounds();
    const focusPath =
      selectedVehicleId && routePath.length > 1
        ? routePath
        : selectedVehicleId && plannedRoutePath.length > 1
          ? plannedRoutePath
          : null;

    if (focusPath) {
      focusPath.forEach((point) => bounds.extend(point));
    } else {
      vehicles.forEach((vehicle) => {
        if (vehicle.location?.lat && vehicle.location?.lng) {
          bounds.extend({ lat: vehicle.location.lat, lng: vehicle.location.lng });
        }
      });
    }

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 40);
    }
  }, [vehicles, routePath, plannedRoutePath, selectedVehicleId]);

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
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onClick={(event) => {
          if (geofencePlacementMode) {
            onMapClick?.({ lat: event.latLng.lat(), lng: event.latLng.lng() });
          }
        }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {plannedRoutePath.length > 1 && (
          <Polyline
            path={plannedRoutePath}
            options={{ strokeColor: '#9E9E9E', strokeWeight: 3, strokeOpacity: 0.8 }}
          />
        )}

        {routePath.length > 1 && (
          <Polyline
            path={routePath}
            options={{ strokeColor: '#1565C0', strokeWeight: 4, strokeOpacity: 0.85 }}
          />
        )}

        {geofences.map((geofence) => {
          if (geofence.type === 'circle' && geofence.center) {
            return (
              <Circle
                key={geofence.id}
                center={{ lat: geofence.center.lat, lng: geofence.center.lng }}
                radius={geofence.radius || 500}
                options={{
                  strokeColor: geofence.color || '#1565C0',
                  fillColor: geofence.color || '#1565C0',
                  fillOpacity: 0.15,
                  strokeOpacity: 0.8,
                }}
              />
            );
          }
          return null;
        })}

        {stopMarkers.map((stop) => (
          <Marker
            key={stop.id || `${stop.sequence}-${stop.name}`}
            position={{ lat: stop.lat, lng: stop.lng }}
            icon={stopIcon}
            title={`Stop ${stop.sequence}: ${stop.name}`}
          />
        ))}

        {vehicles.map((vehicle) => {
          if (!vehicle.location?.lat || !vehicle.location?.lng) return null;
          const isSelected = vehicle.id === selectedVehicleId;

          return (
            <Marker
              key={vehicle.id}
              position={{ lat: vehicle.location.lat, lng: vehicle.location.lng }}
              icon={vehicleIcon(vehicle.ignition, vehicle.heading)}
              zIndex={isSelected ? 1000 : 1}
              title={`${vehicle.vehicleNumber} — ${Math.round(vehicle.speed)} km/h${
                vehicle.activeTripNumber ? ` — Trip ${vehicle.activeTripNumber}` : ''
              }`}
            />
          );
        })}
      </GoogleMap>
    </Box>
  );
};

export default GoogleTrackingMap;
