import { Card, CardContent, Typography, Grid, Box, Chip } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import EmptyState from '../../../components/common/EmptyState';

const engineColors = {
  running: 'success',
  idle: 'warning',
  off: 'default',
};

const LiveVehiclesPanel = ({ vehicles = [] }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Live Vehicles
        </Typography>
        <Chip
          label={`${vehicles.filter((v) => v.ignition).length} active`}
          size="small"
          color="success"
          variant="outlined"
        />
      </Box>
      {vehicles.length === 0 ? (
        <EmptyState title="No live vehicles" description="Active vehicles will appear here" />
      ) : (
        <Grid container spacing={1.5}>
          {vehicles.slice(0, 6).map((vehicle) => (
            <Grid item xs={12} sm={6} key={vehicle.id}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" fontWeight={700}>
                    {vehicle.vehicleNumber}
                  </Typography>
                  <CircleIcon
                    sx={{
                      fontSize: 10,
                      color: vehicle.ignition ? 'success.main' : 'text.disabled',
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {vehicle.manufacturer} {vehicle.model}
                </Typography>
                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                  <Chip label={`${vehicle.speed} mph`} size="small" variant="outlined" />
                  <Chip label={`${Math.round(vehicle.fuelLevel ?? 0)}% fuel`} size="small" variant="outlined" color={vehicle.fuelLevel < 20 ? 'error' : 'default'} />
                  <Chip
                    label={vehicle.engineStatus}
                    size="small"
                    color={engineColors[vehicle.engineStatus] || 'default'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
                {vehicle.location?.address && (
                  <Typography variant="caption" color="text.disabled" display="block" mt={0.5} noWrap>
                    {vehicle.location.address}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </CardContent>
  </Card>
);

export default LiveVehiclesPanel;
