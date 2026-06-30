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
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import { format } from 'date-fns';
import {
  statusColors,
  priorityColors,
  typeLabels,
  getStatusLabel,
  canStart,
  canComplete,
  canUpdateProgress,
  canActOnWorkOrder,
} from '../../maintenance/utils/maintenanceUtils';

const MechanicJobCard = ({
  job,
  user,
  canManage,
  onStart,
  onUpdateProgress,
  onComplete,
  onViewHistory,
  starting,
  compact = false,
  readOnly = false,
}) => {
  const canAct = canActOnWorkOrder(job, user, canManage);
  const vehicle = job.vehicle;
  const showActions = readOnly ? job.status === 'completed' : canAct;

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: job.status === 'overdue' ? 'error.light' : 'divider',
        bgcolor: job.status === 'in_progress' ? 'action.hover' : 'background.paper',
      }}
    >
      <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1}>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {job.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {job.workOrderNumber}
            </Typography>
          </Box>
          <Box display="flex" gap={0.5} flexWrap="wrap" justifyContent="flex-end">
            <Chip
              label={getStatusLabel(job.status)}
              size="small"
              color={statusColors[job.status] || 'default'}
              sx={{ textTransform: 'capitalize' }}
            />
            <Chip
              label={job.priority}
              size="small"
              variant="outlined"
              color={priorityColors[job.priority] || 'default'}
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>
        </Box>

        {vehicle && (
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
              {vehicle.vehicleNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {vehicle.manufacturer} {vehicle.model}
            </Typography>
            {!compact && vehicle.odometer != null && (
              <Box display="flex" alignItems="center" gap={0.5} ml="auto">
                <SpeedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {vehicle.odometer.toLocaleString()} km
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mb={compact ? 0 : 1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {job.scheduledDate
                ? format(new Date(job.scheduledDate), compact ? 'MMM d, HH:mm' : 'EEE, MMM d · HH:mm')
                : '—'}
            </Typography>
          </Box>
          {!compact && (
            <Chip label={typeLabels[job.type] || job.type} size="small" variant="outlined" />
          )}
        </Box>

        {!compact && job.description && (
          <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {job.description}
          </Typography>
        )}

        {showActions && (
          <>
            {!compact && <Divider sx={{ my: 1.5 }} />}
            <Box display="flex" gap={1} flexWrap="wrap">
              {!readOnly && canStart(job.status) && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => onStart(job.id)}
                  disabled={starting}
                >
                  Start Job
                </Button>
              )}
              {!readOnly && canUpdateProgress(job.status) && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UpdateIcon />}
                  onClick={() => onUpdateProgress(job)}
                >
                  Update Progress
                </Button>
              )}
              {!readOnly && canComplete(job.status) && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => onComplete(job)}
                >
                  Complete Job
                </Button>
              )}
              <Button
                size="small"
                variant="text"
                startIcon={<HistoryIcon />}
                onClick={() => onViewHistory(job)}
              >
                View History
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MechanicJobCard;
