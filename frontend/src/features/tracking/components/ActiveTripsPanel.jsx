import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CircleIcon from '@mui/icons-material/Circle';
import EmptyState from '../../../components/common/EmptyState';

const statusColor = {
  in_progress: 'primary',
  scheduled: 'info',
  completed: 'success',
  cancelled: 'default',
};

const ActiveTripsPanel = ({
  activeTrips = [],
  selectedTripId,
  onSelectTrip,
  search,
  onSearchChange,
}) => {
  const filtered = activeTrips.filter((trip) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      trip.tripNumber?.toLowerCase().includes(term) ||
      trip.driver?.name?.toLowerCase().includes(term) ||
      trip.vehicle?.vehicleNumber?.toLowerCase().includes(term) ||
      trip.route?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Active Trips ({activeTrips.length})
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search trips, drivers, vehicles..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </CardContent>
      <Box sx={{ flex: 1, overflow: 'auto', px: 1, pb: 1 }}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No active trips"
            description="Start a scheduled trip to see live tracking here"
          />
        ) : (
          <List dense disablePadding>
            {filtered.map((trip) => (
              <ListItemButton
                key={trip.id}
                selected={trip.id === selectedTripId}
                onClick={() => onSelectTrip(trip.id)}
                sx={{ borderRadius: 2, mb: 0.5, alignItems: 'flex-start' }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                      <CircleIcon
                        sx={{
                          fontSize: 10,
                          color: trip.live?.ignition ? 'success.main' : 'text.disabled',
                        }}
                      />
                      <Typography variant="body2" fontWeight={700}>
                        {trip.tripNumber}
                      </Typography>
                      <Chip
                        label={trip.status.replace('_', ' ')}
                        size="small"
                        color={statusColor[trip.status] || 'default'}
                      />
                    </Box>
                  }
                  secondary={
                    <Box mt={0.5}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {trip.driver?.name} · {trip.vehicle?.vehicleNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {trip.origin?.address || 'Origin'} → {trip.destination?.address || 'Destination'}
                      </Typography>
                      <Box mt={1}>
                        <LinearProgress
                          variant="determinate"
                          value={trip.progress?.percent || 0}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {trip.progress?.percent || 0}% · ETA {trip.eta?.etaMinutes || '--'} min
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Card>
  );
};

export default ActiveTripsPanel;
