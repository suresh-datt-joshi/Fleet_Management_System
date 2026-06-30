import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DoneIcon from '@mui/icons-material/Done';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import {
  alertTypeLabels,
  severityColors,
  severityLabels,
} from '../utils/alertUtils';

const AlertDetailDrawer = ({ open, onClose, alert, onMarkRead, onDelete, canManage, canView }) => {
  if (!alert) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {alert.title}
          </Typography>
          <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
            <Chip label={alertTypeLabels[alert.type] || alert.type} size="small" color="primary" variant="outlined" />
            <Chip label={severityLabels[alert.severity] || alert.severity} size="small" color={severityColors[alert.severity] || 'default'} />
            <Chip label={alert.isRead ? 'Read' : 'Unread'} size="small" variant="outlined" color={alert.isRead ? 'default' : 'warning'} />
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          {alert.message}
        </Typography>

        <DetailRow label="Vehicle" value={alert.vehicle?.vehicleNumber || '—'} />
        <DetailRow label="Driver" value={alert.driver?.name || '—'} />
        <DetailRow label="Created" value={format(new Date(alert.createdAt), 'MMM d, yyyy HH:mm')} />

        <Box display="flex" gap={1} mt={2} flexWrap="wrap">
          {canView && !alert.isRead && (
            <Button size="small" variant="contained" startIcon={<DoneIcon />} onClick={() => onMarkRead(alert.id)}>
              Mark as Read
            </Button>
          )}
          {canManage && (
            <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => onDelete(alert.id)}>
              Delete
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.disabled">
          Alert ID: {alert.id}
        </Typography>
      </Box>
    </Drawer>
  );
};

const DetailRow = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" py={0.5}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>
      {value}
    </Typography>
  </Box>
);

export default AlertDetailDrawer;
