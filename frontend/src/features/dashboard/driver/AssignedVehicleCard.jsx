import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import SpeedIcon from '@mui/icons-material/Speed';
import PlaceIcon from '@mui/icons-material/Place';
import EventIcon from '@mui/icons-material/Event';
import { format } from 'date-fns';

const formatExpiry = (date) => (date ? format(new Date(date), 'MMM d, yyyy') : '—');

const AssignedVehicleCard = ({ vehicle }) => {
  if (!vehicle) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Assigned Vehicle
          </Typography>
          <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
            No vehicle assigned. Contact your fleet manager.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Assigned Vehicle
          </Typography>
          <Chip label={vehicle.status} size="small" sx={{ textTransform: 'capitalize' }} />
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          p={2}
          mb={2}
          borderRadius={2}
          bgcolor="primary.main"
          color="primary.contrastText"
        >
          <LocalShippingIcon fontSize="large" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {vehicle.vehicleNumber}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {vehicle.manufacturer} {vehicle.model}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" flexDirection="column" gap={1.5}>
          {vehicle.fuelLevel != null && (
            <Box display="flex" alignItems="center" gap={1}>
              <LocalGasStationIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Fuel level
              </Typography>
              <Typography variant="body2" fontWeight={600} ml="auto">
                {Math.round(vehicle.fuelLevel)}%
              </Typography>
            </Box>
          )}
          {vehicle.odometer != null && (
            <Box display="flex" alignItems="center" gap={1}>
              <SpeedIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Odometer
              </Typography>
              <Typography variant="body2" fontWeight={600} ml="auto">
                {vehicle.odometer.toLocaleString()} km
              </Typography>
            </Box>
          )}
          {vehicle.location && (
            <Box display="flex" alignItems="flex-start" gap={1}>
              <PlaceIcon fontSize="small" color="action" sx={{ mt: 0.25 }} />
              <Typography variant="body2" color="text.secondary" flex={1}>
                {vehicle.location}
              </Typography>
            </Box>
          )}
          {(vehicle.insuranceExpiry || vehicle.registrationExpiry) && (
            <Box display="flex" alignItems="center" gap={1}>
              <EventIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Insurance / Registration
              </Typography>
              <Typography variant="caption" fontWeight={600} ml="auto" textAlign="right">
                {formatExpiry(vehicle.insuranceExpiry)} / {formatExpiry(vehicle.registrationExpiry)}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AssignedVehicleCard;
