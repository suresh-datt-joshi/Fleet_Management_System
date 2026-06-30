import { Grid, Card, CardContent, Typography, Skeleton } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import SpeedIcon from '@mui/icons-material/Speed';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import CommuteIcon from '@mui/icons-material/Commute';
import FenceIcon from '@mui/icons-material/Fence';

const statConfig = [
  { key: 'activeTrips', label: 'Active Trips', icon: CommuteIcon, color: '#6A1B9A' },
  { key: 'live', label: 'Live Vehicles', icon: GpsFixedIcon, color: '#1565C0' },
  { key: 'moving', label: 'Moving', icon: SpeedIcon, color: '#2E7D32' },
  { key: 'idle', label: 'Idle', icon: PauseCircleIcon, color: '#ED6C02' },
  { key: 'lowFuel', label: 'Low Fuel', icon: LocalGasStationIcon, color: '#D32F2F' },
  { key: 'geofenceCount', label: 'Geofences', icon: FenceIcon, color: '#7B1FA2' },
];

const TrackingStatsCards = ({ stats, isLoading }) => (
  <Grid container spacing={2}>
    {statConfig.map(({ key, label, icon: Icon, color }) => (
      <Grid item xs={6} sm={4} md={2} key={key}>
        <Card>
          <CardContent sx={{ py: 2 }}>
            <Icon sx={{ color, mb: 1 }} />
            {isLoading ? (
              <Skeleton width={40} height={32} />
            ) : (
              <Typography variant="h5" fontWeight={700}>
                {stats?.[key] ?? 0}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

export default TrackingStatsCards;
