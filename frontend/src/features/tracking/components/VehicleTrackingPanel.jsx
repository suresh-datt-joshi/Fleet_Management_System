import {
  Box,
  Card,
  CardContent,
  Chip,
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

const VehicleTrackingPanel = ({
  vehicles = [],
  selectedVehicleId,
  onSelectVehicle,
  search,
  onSearchChange,
}) => {
  const filtered = vehicles.filter(
    (v) =>
      !search ||
      v.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
      v.model?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Fleet ({vehicles.length})
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search vehicles..."
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
          <EmptyState title="No vehicles" description="Active vehicles will appear on the map" />
        ) : (
          <List dense disablePadding>
            {filtered.map((vehicle) => (
              <ListItemButton
                key={vehicle.id}
                selected={vehicle.id === selectedVehicleId}
                onClick={() => onSelectVehicle(vehicle.id)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <CircleIcon
                        sx={{ fontSize: 10, color: vehicle.ignition ? 'success.main' : 'text.disabled' }}
                      />
                      <Typography variant="body2" fontWeight={700}>
                        {vehicle.vehicleNumber}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box mt={0.5}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {vehicle.manufacturer} {vehicle.model}
                        {vehicle.activeTripNumber ? ` · Trip ${vehicle.activeTripNumber}` : ''}
                      </Typography>
                      <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                        <Chip label={`${Math.round(vehicle.speed)} km/h`} size="small" variant="outlined" />
                        <Chip
                          label={`${Math.round(vehicle.fuelLevel)}%`}
                          size="small"
                          variant="outlined"
                          color={vehicle.fuelLevel < 20 ? 'error' : 'default'}
                        />
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

export default VehicleTrackingPanel;
