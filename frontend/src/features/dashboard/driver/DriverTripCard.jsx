import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UpdateIcon from '@mui/icons-material/Update';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import RouteIcon from '@mui/icons-material/Route';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { format } from 'date-fns';
import { TRIP_STATUS } from '../../../constants';
import { formatLocation } from '../../trips/utils/tripUtils';
import {
  DRIVER_TRIP_STATUS_COLORS,
  DRIVER_TRIP_STATUS_LABELS,
} from './driverDashboardUtils';

const DriverTripCard = ({
  trip,
  onStart,
  onUpdateStatus,
  onComplete,
  onViewHistory,
  starting,
  compact = false,
  readOnly = false,
}) => {
  const isAssigned = trip.status === TRIP_STATUS.SCHEDULED;
  const isInProgress = trip.status === TRIP_STATUS.IN_PROGRESS;
  const showActions = !readOnly && (isAssigned || isInProgress);

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: isInProgress ? 'warning.light' : 'divider',
        bgcolor: isInProgress ? 'action.hover' : 'background.paper',
      }}
    >
      <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1}>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {trip.tripNumber}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
              <RouteIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {formatLocation(trip.origin)} → {formatLocation(trip.destination)}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={DRIVER_TRIP_STATUS_LABELS[trip.status] || trip.status}
            size="small"
            color={DRIVER_TRIP_STATUS_COLORS[trip.status] || 'default'}
          />
        </Box>

        {trip.vehicle && (
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            p={1}
            mb={1}
            borderRadius={1}
            bgcolor="background.default"
            flexWrap="wrap"
          >
            <LocalShippingIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={600}>
              {trip.vehicle.vehicleNumber}
            </Typography>
            {!compact && (
              <Typography variant="body2" color="text.secondary">
                {trip.vehicle.manufacturer} {trip.vehicle.model}
              </Typography>
            )}
          </Box>
        )}

        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mb={compact ? 0 : 1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {trip.scheduledAt
                ? format(new Date(trip.scheduledAt), compact ? 'MMM d, HH:mm' : 'EEE, MMM d · HH:mm')
                : trip.startedAt
                  ? `Started ${format(new Date(trip.startedAt), 'MMM d, HH:mm')}`
                  : '—'}
            </Typography>
          </Box>
        </Box>

        {showActions && (
          <>
            {!compact && <Divider sx={{ my: 1.5 }} />}
            <Box display="flex" gap={1} flexWrap="wrap">
              {isAssigned && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => onStart?.(trip.id)}
                  disabled={starting}
                >
                  Start Trip
                </Button>
              )}
              {isInProgress && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<UpdateIcon />}
                    onClick={() => onUpdateStatus?.(trip)}
                  >
                    Update Status
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => onComplete?.(trip)}
                  >
                    Complete Trip
                  </Button>
                </>
              )}
              <Button
                size="small"
                variant="text"
                startIcon={<HistoryIcon />}
                onClick={() => onViewHistory?.(trip)}
              >
                View History
              </Button>
            </Box>
          </>
        )}

        {readOnly && (
          <Button size="small" variant="text" startIcon={<HistoryIcon />} onClick={() => onViewHistory?.(trip)} sx={{ mt: 1 }}>
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverTripCard;
