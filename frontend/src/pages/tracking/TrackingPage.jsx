import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Grid, Tab, Tabs, Typography, Skeleton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { useSnackbar } from 'notistack';
import TrackingStatsCards from '../../features/tracking/components/TrackingStatsCards';
import LiveTrackingMap from '../../features/tracking/components/LiveTrackingMap';
import ActiveTripsPanel from '../../features/tracking/components/ActiveTripsPanel';
import ActiveTripDetailPanel from '../../features/tracking/components/ActiveTripDetailPanel';
import VehicleTrackingPanel from '../../features/tracking/components/VehicleTrackingPanel';
import GeofencePanel from '../../features/tracking/components/GeofencePanel';
import RouteHistoryPanel from '../../features/tracking/components/RouteHistoryPanel';
import {
  useGetLiveTrackingDashboardQuery,
  useGetGeofencesQuery,
  useTriggerGpsSimulationMutation,
} from '../../redux/api/trackingApi';
import useGpsSocket from '../../hooks/useGpsSocket';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants';
import ErrorState from '../../components/common/ErrorState';

const TrackingPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();
  const canSimulate = hasPermission(PERMISSIONS.MANAGE_GEOFENCES);

  const [selectedTripId, setSelectedTripId] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [tripSearch, setTripSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [liveOverrides, setLiveOverrides] = useState({});
  const [sidebarTab, setSidebarTab] = useState(0);
  const [geofencePlacementMode, setGeofencePlacementMode] = useState(false);
  const [pendingCenter, setPendingCenter] = useState(null);

  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetLiveTrackingDashboardQuery(undefined, {
    pollingInterval: 15000,
  });

  const [triggerSimulation, { isLoading: simulating }] = useTriggerGpsSimulationMutation();
  const { data: geofenceData } = useGetGeofencesQuery({ limit: 100, isActive: 'true' });

  const dashboard = dashboardData?.data;
  const stats = dashboard?.stats;

  const activeTrips = useMemo(() => {
    const trips = dashboard?.activeTrips || [];
    return trips.map((trip) => {
      const vehicleOverride = trip.vehicle?.id ? liveOverrides[trip.vehicle.id] : null;
      if (!vehicleOverride) return trip;

      return {
        ...trip,
        live: {
          ...(trip.live || {}),
          ...vehicleOverride,
          lat: vehicleOverride.location?.lat ?? trip.live?.lat,
          lng: vehicleOverride.location?.lng ?? trip.live?.lng,
          speed: vehicleOverride.speed ?? trip.live?.speed,
          fuelLevel: vehicleOverride.fuelLevel ?? trip.live?.fuelLevel,
          ignition: vehicleOverride.ignition ?? trip.live?.ignition,
          lastUpdated: vehicleOverride.lastUpdated ?? trip.live?.lastUpdated,
        },
      };
    });
  }, [dashboard?.activeTrips, liveOverrides]);

  const vehicles = useMemo(() => {
    const fleet = dashboard?.vehicles || [];
    return fleet.map((vehicle) => ({
      ...vehicle,
      ...(liveOverrides[vehicle.id] || {}),
    }));
  }, [dashboard?.vehicles, liveOverrides]);

  const selectedTrip =
    activeTrips.find((trip) => trip.id === selectedTripId) ||
    activeTrips.find((trip) => trip.vehicle?.id === selectedVehicleId) ||
    null;

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ||
    vehicles.find((vehicle) => vehicle.id === selectedTrip?.vehicle?.id) ||
    null;

  useEffect(() => {
    if (!selectedTripId && activeTrips.length > 0) {
      setSelectedTripId(activeTrips[0].id);
      setSelectedVehicleId(activeTrips[0].vehicle?.id || null);
    }
  }, [activeTrips, selectedTripId]);

  const handleVehicleUpdate = useCallback((payload) => {
    setLiveOverrides((prev) => ({
      ...prev,
      [payload.id]: payload,
    }));
  }, []);

  useGpsSocket({
    enabled: true,
    onVehicleUpdate: handleVehicleUpdate,
  });

  const plannedPath = selectedTrip?.plannedPath || [];
  const breadcrumbPath = selectedTrip?.breadcrumbPath || [];
  const stopMarkers = selectedTrip?.route?.stops || [];
  const geofences = geofenceData?.data?.geofences || [];

  const handleRefresh = () => {
    refetch();
    setLiveOverrides({});
  };

  const handleSimulate = async () => {
    try {
      await triggerSimulation().unwrap();
      enqueueSnackbar('GPS simulation triggered', { variant: 'info' });
      refetch();
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Simulation failed', { variant: 'error' });
    }
  };

  const handleSelectTrip = (tripId) => {
    setSelectedTripId(tripId);
    const trip = activeTrips.find((item) => item.id === tripId);
    if (trip?.vehicle?.id) {
      setSelectedVehicleId(trip.vehicle.id);
    }
  };

  const handleSelectVehicle = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    const trip = activeTrips.find((item) => item.vehicle?.id === vehicleId);
    if (trip) {
      setSelectedTripId(trip.id);
    }
  };

  const handleMapClick = ({ lat, lng }) => {
    if (geofencePlacementMode) {
      setPendingCenter({ lat, lng });
    }
  };

  if (isError) {
    return <ErrorState message="Failed to load live tracking dashboard" onRetry={refetch} />;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Live Tracking
          </Typography>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Chip
              icon={<GpsFixedIcon />}
              label={`Provider: ${stats?.provider || dashboard?.provider || 'mock'}`}
              size="small"
              variant="outlined"
            />
            <Chip label="Real-time trip & fleet dashboard" size="small" color="success" variant="outlined" />
            {isFetching && !isLoading && (
              <Chip label="Updating..." size="small" color="info" variant="outlined" />
            )}
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={handleRefresh}>
            Refresh
          </Button>
          {canSimulate && (
            <Button variant="contained" onClick={handleSimulate} disabled={simulating}>
              Simulate GPS
            </Button>
          )}
        </Box>
      </Box>

      <Box mb={3}>
        {isLoading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={6} sm={4} md={2} key={index}>
                <Skeleton variant="rounded" height={96} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <TrackingStatsCards stats={stats} isLoading={isLoading} />
        )}
      </Box>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} lg={8}>
          <LiveTrackingMap
            vehicles={vehicles}
            geofences={geofences}
            route={breadcrumbPath}
            plannedPath={plannedPath}
            stopMarkers={stopMarkers}
            selectedVehicleId={selectedVehicleId}
            selectedVehicle={selectedVehicle}
            geofencePlacementMode={geofencePlacementMode}
            onMapClick={handleMapClick}
            height={560}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <Box sx={{ height: 560, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Tabs value={sidebarTab} onChange={(_, value) => setSidebarTab(value)} variant="fullWidth">
              <Tab label={`Active Trips (${activeTrips.length})`} />
              <Tab label={`Fleet (${vehicles.length})`} />
            </Tabs>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              {sidebarTab === 0 ? (
                <ActiveTripsPanel
                  activeTrips={activeTrips}
                  selectedTripId={selectedTripId}
                  onSelectTrip={handleSelectTrip}
                  search={tripSearch}
                  onSearchChange={setTripSearch}
                />
              ) : (
                <VehicleTrackingPanel
                  vehicles={vehicles}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={handleSelectVehicle}
                  search={vehicleSearch}
                  onSearchChange={setVehicleSearch}
                />
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} lg={7}>
          <ActiveTripDetailPanel trip={selectedTrip} />
        </Grid>
        <Grid item xs={12} lg={5}>
          <RouteHistoryPanel
            vehicleId={selectedVehicleId}
            vehicleNumber={selectedVehicle?.vehicleNumber}
            routePoints={breadcrumbPath}
          />
        </Grid>
      </Grid>

      <GeofencePanel
        placementMode={geofencePlacementMode}
        onTogglePlacement={setGeofencePlacementMode}
        pendingCenter={pendingCenter}
        onClearPendingCenter={() => setPendingCenter(null)}
      />
    </Box>
  );
};

export default TrackingPage;
