import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RouteIcon from '@mui/icons-material/Route';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import EmptyState from '../../../components/common/EmptyState';

const formatTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString();
};

const DetailRow = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" gap={2} py={0.75}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600} textAlign="right">
      {value}
    </Typography>
  </Box>
);

const ActiveTripDetailPanel = ({ trip }) => {
  if (!trip) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <EmptyState
            title="Select an active trip"
            description="Choose a trip from the list to view live driver, vehicle, route, and progress details"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={2}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {trip.tripNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trip.route?.name || 'Manual route'}
            </Typography>
          </Box>
          <Chip label={trip.status.replace('_', ' ')} color="primary" />
        </Box>

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" fontWeight={600}>
              Trip progress
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {trip.progress?.percent || 0}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={trip.progress?.percent || 0}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            {trip.progress?.distanceCoveredKm || 0} km covered ·{' '}
            {trip.progress?.distanceRemainingKm || 0} km remaining
          </Typography>
        </Box>

        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Chip icon={<SpeedIcon />} label={`${Math.round(trip.live?.speed || 0)} km/h`} size="small" />
          </Grid>
          <Grid item xs={6}>
            <Chip
              icon={<AccessTimeIcon />}
              label={`ETA ${trip.eta?.etaMinutes || '--'} min`}
              size="small"
              color="info"
            />
          </Grid>
          <Grid item xs={6}>
            <Chip
              label={`Fuel ${Math.round(trip.live?.fuelLevel || trip.vehicle?.fuelLevel || 0)}%`}
              size="small"
              color={(trip.live?.fuelLevel || 0) < 20 ? 'error' : 'default'}
            />
          </Grid>
          <Grid item xs={6}>
            <Chip
              label={trip.live?.ignition ? 'Engine on' : 'Engine off'}
              size="small"
              color={trip.live?.ignition ? 'success' : 'default'}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
          Driver
        </Typography>
        <DetailRow label="Name" value={trip.driver?.name || '--'} />
        <DetailRow label="Phone" value={trip.driver?.phone || '--'} />
        <DetailRow label="License" value={trip.driver?.licenseNumber || '--'} />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          <LocalShippingIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
          Vehicle
        </Typography>
        <DetailRow label="Number" value={trip.vehicle?.vehicleNumber || '--'} />
        <DetailRow
          label="Model"
          value={`${trip.vehicle?.manufacturer || ''} ${trip.vehicle?.model || ''}`.trim() || '--'}
        />
        <DetailRow label="Odometer" value={`${trip.vehicle?.odometer ?? '--'} km`} />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          <RouteIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
          Route & Stops
        </Typography>
        <DetailRow label="Route" value={trip.route?.routeNumber || 'Manual'} />
        <DetailRow label="Started" value={formatTime(trip.startedAt)} />
        <DetailRow label="Est. arrival" value={formatTime(trip.eta?.estimatedArrivalAt)} />
        <DetailRow label="Current stop" value={trip.currentStop?.name || 'En route'} />
        <DetailRow label="Next stop" value={trip.nextStop?.name || trip.destination?.address || '--'} />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          <PlaceIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
          Locations
        </Typography>
        <DetailRow label="Origin" value={trip.origin?.address || '--'} />
        <DetailRow label="Destination" value={trip.destination?.address || '--'} />
        <DetailRow
          label="Current position"
          value={trip.live?.address || `${trip.live?.lat?.toFixed(4)}, ${trip.live?.lng?.toFixed(4)}`}
        />
        <DetailRow label="Last update" value={formatTime(trip.live?.lastUpdated)} />
      </CardContent>
    </Card>
  );
};

export default ActiveTripDetailPanel;
