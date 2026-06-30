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
  Link,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { format } from 'date-fns';
import { useGetMaintenanceHistoryQuery } from '../../../redux/api/maintenanceApi';
import { API_BASE_URL, USER_ROLES } from '../../../constants';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  statusColors,
  priorityColors,
  typeLabels,
  formatCurrency,
  getStatusLabel,
  canStart,
  canComplete,
  canEdit,
  getAssignedMechanics,
  isMaintenanceAssigned,
  canActOnWorkOrder,
} from '../utils/maintenanceUtils';

const getFileUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const base = API_BASE_URL.replace('/api/v1', '');
  return `${base}${url}`;
};

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
  user,
}) => {
  const { hasRole } = usePermissions();
  const isMechanic = hasRole(USER_ROLES.MECHANIC);
  const { data: historyData, isLoading: historyLoading } = useGetMaintenanceHistoryQuery(
    { id: record?.id, limit: 10, sort: 'createdAt:desc' },
    { skip: !record?.id || !open }
  );

  if (!record) return null;

  const history = historyData?.data?.history || [];
  const canAct = canActOnWorkOrder(record, user, canManage);
  const assignedMechanics = getAssignedMechanics(record);
  const isAssigned = isMaintenanceAssigned(record);
  const showAssignAction = canAssign && record.status !== 'completed' && !isAssigned;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {record.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {record.workOrderNumber}
          </Typography>
          <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
            <Chip label={getStatusLabel(record.status)} size="small" color={statusColors[record.status] || 'default'} sx={{ textTransform: 'capitalize' }} />
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
        <GridRow label="Issue" value={record.description || '—'} />
        <GridRow label="Scheduled" value={format(new Date(record.scheduledDate), 'MMM d, yyyy HH:mm')} />
        {record.completedDate && (
          <GridRow label="Completed" value={format(new Date(record.completedDate), 'MMM d, yyyy HH:mm')} />
        )}
        {!isAssigned && <GridRow label="Mechanics" value="Unassigned" />}
        <GridRow label="Odometer" value={record.odometerAtService ? `${record.odometerAtService} km` : '—'} />
        {record.status === 'completed' && (
          <>
            <GridRow label="Labor Hours" value={record.laborHours ?? '—'} />
            <GridRow label="Labor Cost" value={formatCurrency(record.laborCost)} />
            <GridRow label="Parts Cost" value={formatCurrency(record.partsCost)} />
            <GridRow label="Total Cost" value={formatCurrency(record.cost)} bold />
          </>
        )}
        {record.serviceProvider && <GridRow label="Provider" value={record.serviceProvider} />}
        {record.workPerformed && (
          <>
            <Typography variant="subtitle2" fontWeight={700} mt={2} mb={0.5}>
              Work Performed
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {record.workPerformed}
            </Typography>
          </>
        )}
        {record.notes && <GridRow label="Notes" value={record.notes} />}

        {isAssigned && (
          <Box mt={2} p={1.5} borderRadius={2} bgcolor="action.hover">
            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Assigned Mechanic{assignedMechanics.length > 1 ? 's' : ''}
            </Typography>
            {assignedMechanics.map((mechanic) => (
              <Box key={mechanic.id} display="flex" alignItems="center" gap={1.5} mb={assignedMechanics.length > 1 ? 1 : 0}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <PersonIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {mechanic.name}
                  </Typography>
                  {mechanic.email && (
                    <Typography variant="caption" color="text.secondary">
                      {mechanic.email}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {(canManage || canAssign || canAct) && (
          <Box display="flex" gap={1} mt={2} flexWrap="wrap" alignItems="center">
            {canManage && canEdit(record.status) && (
              <Button size="small" variant="outlined" onClick={() => onEdit(record)}>
                Edit
              </Button>
            )}
            {showAssignAction && (
              <Button size="small" variant="outlined" startIcon={<PersonAddIcon />} onClick={() => onAssign(record)}>
                Assign Mechanic
              </Button>
            )}
            {canAct && canStart(record.status) && (
              <Button
                size="small"
                variant="contained"
                startIcon={loadingAction ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                onClick={() => onStart(record.id)}
                disabled={loadingAction}
              >
                Start Work
              </Button>
            )}
            {canAct && canComplete(record.status) && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<AssignmentIcon />}
                onClick={() => onComplete(record)}
              >
                Submit Report
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
                <ListItem key={p.id || p.name} sx={{ px: 0 }}>
                  <ListItemText
                    primary={p.name}
                    secondary={`Qty: ${p.quantity} · ${formatCurrency(p.cost * p.quantity)}${p.supplier ? ` · ${p.supplier}` : ''}`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {!isMechanic && record.attachments?.length > 0 && (
          <>
            <Typography variant="subtitle2" fontWeight={700} mt={2} mb={1}>
              Documents
            </Typography>
            <List dense disablePadding>
              {record.attachments.map((doc) => (
                <ListItem key={doc.id || doc.fileName} sx={{ px: 0 }}>
                  <AttachFileIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Link href={getFileUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" variant="body2">
                    {doc.fileName}
                  </Link>
                </ListItem>
              ))}
            </List>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          Activity Log
        </Typography>
        {historyLoading ? (
          <CircularProgress size={24} />
        ) : (
          <List dense disablePadding>
            {history.map((h) => (
              <ListItem key={h.id} sx={{ px: 0 }}>
                <ListItemText
                  primary={h.description}
                  secondary={`${h.action.replace('_', ' ')} · ${h.performedBy?.name || 'System'} · ${format(new Date(h.createdAt), 'MMM d, HH:mm')}`}
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
  <Box display="flex" justifyContent="space-between" py={0.5} gap={2}>
    <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={bold ? 700 : 400} textAlign="right">
      {value}
    </Typography>
  </Box>
);

export default MaintenanceDetailDrawer;
