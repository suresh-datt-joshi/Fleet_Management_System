import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RouteIcon from '@mui/icons-material/Route';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import RouteMap from './RouteMap';
import {
  formatDistance,
  formatDuration,
  getDisplayStops,
  statusColors,
  trafficColors,
  stopTypeLabels,
} from '../utils/routeUtils';
import { useGetRouteHistoryQuery, useGetRouteQuery } from '../../../redux/api/routesApi';

const RouteDetailDrawer = ({
  open,
  onClose,
  route,
  onEdit,
  onOptimize,
  onDelete,
  canManage,
  optimizing,
  deleting = false,
}) => {
  const { data: routeData } = useGetRouteQuery(route?.id, {
    skip: !route?.id || !open,
  });
  const { data: historyData, isLoading: historyLoading } = useGetRouteHistoryQuery(
    { id: route?.id, limit: 10, sort: 'createdAt:desc' },
    { skip: !route?.id || !open }
  );

  const displayRoute = routeData?.data?.route || route;
  const stops = getDisplayStops(displayRoute);
  const history = historyData?.data?.history || [];

  if (!displayRoute) return null;

  const formatLocation = (location) => {
    if (!location) return '—';
    if (location.address) return location.address;
    if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
      return `${location.lat}, ${location.lng}`;
    }
    return '—';
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {displayRoute.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {displayRoute.routeNumber}
          </Typography>
          <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
            <Chip label={displayRoute.status} size="small" color={statusColors[displayRoute.status] || 'default'} sx={{ textTransform: 'capitalize' }} />
            {displayRoute.isOptimized && <Chip label="Optimized" size="small" color="primary" variant="outlined" />}
            <Chip label={`Traffic: ${displayRoute.trafficLevel}`} size="small" color={trafficColors[displayRoute.trafficLevel] || 'default'} sx={{ textTransform: 'capitalize' }} />
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <RouteMap key={displayRoute.id} route={displayRoute} height={320} visible={open} />

        <GridMetrics route={displayRoute} />

        {canManage && (
          <Box display="flex" gap={1} mt={2} flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={() => onEdit(displayRoute)}>
              Edit
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={optimizing ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighIcon />}
              onClick={() => onOptimize(displayRoute.id)}
              disabled={optimizing}
            >
              Optimize for Traffic
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
              onClick={() => onDelete?.(displayRoute.id)}
              disabled={deleting}
            >
              Delete
            </Button>
          </Box>
        )}

        <Typography variant="subtitle2" fontWeight={700} mt={3} mb={1}>
          Stops ({stops.length})
        </Typography>
        <List dense disablePadding>
          <ListItem sx={{ px: 0 }}>
            <ListItemText primary="Origin" secondary={formatLocation(displayRoute.origin)} />
          </ListItem>
          {stops.map((stop, i) => (
            <ListItem key={stop.id || i} sx={{ px: 0 }}>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <RouteIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                    <Typography variant="body2" fontWeight={600}>
                      {stop.name}
                    </Typography>
                    <Chip label={stopTypeLabels[stop.stopType] || stop.stopType} size="small" variant="outlined" />
                  </Box>
                }
                secondary={`${stop.address || ''} · ${stop.estimatedDurationMinutes} min dwell`}
              />
            </ListItem>
          ))}
          <ListItem sx={{ px: 0 }}>
            <ListItemText primary="Destination" secondary={formatLocation(displayRoute.destination)} />
          </ListItem>
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          History
        </Typography>
        {historyLoading ? (
          <CircularProgress size={24} />
        ) : history.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No history yet
          </Typography>
        ) : (
          <List dense disablePadding>
            {history.map((h) => (
              <ListItem key={h.id} sx={{ px: 0 }}>
                <ListItemText
                  primary={h.description}
                  secondary={`${h.action} · ${format(new Date(h.createdAt), 'MMM d, yyyy HH:mm')}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

const GridMetrics = ({ route }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 1.5,
      mt: 2,
    }}
  >
    <MetricCard label="Distance" value={formatDistance(route.totalDistanceMeters)} />
    <MetricCard label="ETA" value={formatDuration(route.estimatedDurationMinutes)} />
    <MetricCard
      label="Arrival"
      value={route.estimatedArrivalAt ? format(new Date(route.estimatedArrivalAt), 'MMM d, HH:mm') : '—'}
    />
    <MetricCard label="Traffic Delay" value={`+${route.trafficDelayMinutes || 0} min`} />
  </Box>
);

const MetricCard = ({ label, value }) => (
  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={700}>
      {value}
    </Typography>
  </Box>
);

export default RouteDetailDrawer;
