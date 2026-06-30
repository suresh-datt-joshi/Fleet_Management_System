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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { format } from 'date-fns';
import { useGetMaintenanceHistoryQuery } from '../../../redux/api/maintenanceApi';
import {
  statusColors,
  priorityColors,
  typeLabels,
  formatCurrency,
  canStart,
  canComplete,
  canEdit,
} from '../utils/maintenanceUtils';

const MaintenanceDetailDrawer = ({
  open,
  onClose,
  record,
  onEdit,
  onAssign,
  onStart,
  onComplete,
  canManage,
  canAssign,
  loadingAction,
}) => {
  const { data: historyData, isLoading: historyLoading } = useGetMaintenanceHistoryQuery(
    { id: record?.id, limit: 10, sort: 'createdAt:desc' },
    { skip: !record?.id || !open }
  );

  if (!record) return null;

  const history = historyData?.data?.history || [];

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {record.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {record.workOrderNumber}
          </Typography>
          <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
            <Chip label={record.status.replace('_', ' ')} size="small" color={statusColors[record.status] || 'default'} sx={{ textTransform: 'capitalize' }} />
            <Chip label={typeLabels[record.type] || record.type} size="small" variant="outlined" />
            <Chip label={record.priority} size="small" color={priorityColors[record.priority] || 'default'} sx={{ textTransform: 'capitalize' }} />
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <GridRow label="Vehicle" value={`${record.vehicle?.vehicleNumber} — ${record.vehicle?.manufacturer} ${record.vehicle?.model}`} />
        <GridRow label="Scheduled" value={format(new Date(record.scheduledDate), 'MMM d, yyyy HH:mm')} />
        {record.completedDate && (
          <GridRow label="Completed" value={format(new Date(record.completedDate), 'MMM d, yyyy HH:mm')} />
        )}
        <GridRow label="Mechanic" value={record.assignedMechanic?.name || 'Unassigned'} />
        <GridRow label="Odometer" value={record.odometerAtService ? `${record.odometerAtService} km` : '—'} />
        <GridRow label="Labor Cost" value={formatCurrency(record.laborCost)} />
        <GridRow label="Parts Cost" value={formatCurrency(record.partsCost)} />
        <GridRow label="Total Cost" value={formatCurrency(record.cost)} bold />
        {record.serviceProvider && <GridRow label="Provider" value={record.serviceProvider} />}
        {record.description && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            {record.description}
          </Typography>
        )}

        {(canManage || canAssign) && (
          <Box display="flex" gap={1} mt={2} flexWrap="wrap">
            {canManage && canEdit(record.status) && (
              <Button size="small" variant="outlined" onClick={() => onEdit(record)}>
                Edit
              </Button>
            )}
            {canAssign && (
              <Button size="small" variant="outlined" startIcon={<PersonAddIcon />} onClick={() => onAssign(record)}>
                Assign
              </Button>
            )}
            {canManage && canStart(record.status) && (
              <Button
                size="small"
                variant="contained"
                startIcon={loadingAction ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                onClick={() => onStart(record.id)}
                disabled={loadingAction}
              >
                Start
              </Button>
            )}
            {canManage && canComplete(record.status) && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => onComplete(record)}
              >
                Complete
              </Button>
            )}
          </Box>
        )}

        {record.parts?.length > 0 && (
          <>
            <Typography variant="subtitle2" fontWeight={700} mt={3} mb={1}>
              Parts ({record.parts.length})
            </Typography>
            <List dense disablePadding>
              {record.parts.map((p) => (
                <ListItem key={p.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={p.name}
                    secondary={`Qty: ${p.quantity} · ${formatCurrency(p.cost * p.quantity)}`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          History
        </Typography>
        {historyLoading ? (
          <CircularProgress size={24} />
        ) : (
          <List dense disablePadding>
            {history.map((h) => (
              <ListItem key={h.id} sx={{ px: 0 }}>
                <ListItemText
                  primary={h.description}
                  secondary={`${h.action} · ${format(new Date(h.createdAt), 'MMM d, HH:mm')}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

const GridRow = ({ label, value, bold }) => (
  <Box display="flex" justifyContent="space-between" py={0.5}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={bold ? 700 : 400}>
      {value}
    </Typography>
  </Box>
);

export default MaintenanceDetailDrawer;
