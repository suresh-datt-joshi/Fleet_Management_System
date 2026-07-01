import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Grid,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BuildIcon from '@mui/icons-material/Build';
import { useRef } from 'react';
import { format } from 'date-fns';
import { statusColors, fuelTypeLabels } from '../utils/vehicleUtils';
import { formatRelativeTime } from '../../../utils/formatters';
import { useGetVehicleHistoryQuery } from '../../../redux/api/vehiclesApi';
import { useGetVehicleMaintenanceLogsQuery } from '../../../redux/api/maintenanceApi';
import { formatCurrency, getMechanicNames, typeLabels } from '../../maintenance/utils/maintenanceUtils';
import { API_BASE_URL } from '../../../constants';

const DetailItem = ({ label, value }) => (
  <Grid item xs={6} sm={4}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>
      {value ?? '—'}
    </Typography>
  </Grid>
);

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const base = API_BASE_URL.replace('/api/v1', '');
  return `${base}${url}`;
};

const VehicleDetailDrawer = ({
  open,
  onClose,
  vehicle,
  onEdit,
  onAssign,
  onUnassign,
  onDelete,
  onUploadImage,
  onDeleteImage,
  onScheduleMaintenance,
  canUpdate,
  canDelete,
  canAssign,
  canScheduleMaintenance,
  isUploading,
}) => {
  const fileInputRef = useRef(null);
  const { data: historyData, isLoading: historyLoading } = useGetVehicleHistoryQuery(
    { id: vehicle?._id, limit: 10 },
    { skip: !vehicle?._id || !open }
  );
  const { data: maintenanceLogsData, isLoading: maintenanceLogsLoading } = useGetVehicleMaintenanceLogsQuery(
    { vehicleId: vehicle?._id, limit: 5 },
    { skip: !vehicle?._id || !open }
  );

  if (!vehicle) return null;

  const history = historyData?.data?.history || [];
  const maintenanceLogs = maintenanceLogsData?.data?.logs || [];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadImage(file);
    e.target.value = '';
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
      <Box sx={{ p: 2.5, height: '100%', overflow: 'auto' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5" fontWeight={700}>
            {vehicle.vehicleNumber}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip label={vehicle.status} color={statusColors[vehicle.status] || 'default'} size="small" sx={{ textTransform: 'capitalize' }} />
          <Chip label={fuelTypeLabels[vehicle.fuelType] || vehicle.fuelType} size="small" variant="outlined" />
        </Box>

        {vehicle.image && (
          <Box
            component="img"
            src={getImageUrl(vehicle.image)}
            alt={vehicle.vehicleNumber}
            sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 2, mb: 2 }}
          />
        )}

        <Grid container spacing={2} mb={2}>
          <DetailItem label="Manufacturer" value={vehicle.manufacturer} />
          <DetailItem label="Model" value={vehicle.model} />
          <DetailItem label="Year" value={vehicle.year} />
          <DetailItem label="VIN" value={vehicle.vin} />
          <DetailItem label="RC Number" value={vehicle.registrationNumber} />
          <DetailItem label="Odometer" value={`${vehicle.odometer?.toLocaleString()} km`} />
          <DetailItem label="Last Service" value={vehicle.lastServiceDate ? format(new Date(vehicle.lastServiceDate), 'MMM d, yyyy') : '—'} />
          <DetailItem label="Fuel Level" value={`${Math.round(vehicle.fuelLevel ?? 0)}%`} />
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Documents Expiry
        </Typography>
        <Grid container spacing={2} mb={2}>
          <DetailItem label="Insurance" value={formatDate(vehicle.documentExpiry?.insurance)} />
          <DetailItem label="Registration" value={formatDate(vehicle.documentExpiry?.registration)} />
          <DetailItem label="Fitness" value={formatDate(vehicle.documentExpiry?.fitness)} />
          <DetailItem label="Emission" value={formatDate(vehicle.documentExpiry?.emission)} />
          <DetailItem label="Permit" value={formatDate(vehicle.documentExpiry?.permit)} />
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Assigned Driver
        </Typography>
        {vehicle.assignedDriver ? (
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box flex={1}>
              <Typography variant="body2" fontWeight={600}>
                {vehicle.assignedDriver.firstName} {vehicle.assignedDriver.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {vehicle.assignedDriver.employeeId}
              </Typography>
            </Box>
            {canAssign && (
              <Button size="small" onClick={onUnassign}>
                Unassign
              </Button>
            )}
          </Box>
        ) : (
          <Box mb={1}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              No driver assigned
            </Typography>
            {canAssign && (
              <Button size="small" variant="outlined" startIcon={<PersonIcon />} onClick={onAssign}>
                Assign Driver
              </Button>
            )}
          </Box>
        )}

        {canUpdate && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Images
            </Typography>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
            <Button
              size="small"
              variant="outlined"
              startIcon={isUploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              sx={{ mb: 1 }}
            >
              Upload Image
            </Button>
            <Box display="flex" gap={1} flexWrap="wrap">
              {(vehicle.images || []).map((img) => (
                <Box key={img.publicId || img.url} position="relative">
                  <Box
                    component="img"
                    src={getImageUrl(img.url)}
                    alt=""
                    sx={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 1 }}
                  />
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                    onClick={() => onDeleteImage(img.publicId)}
                  >
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle2" fontWeight={600}>
            Maintenance History
          </Typography>
          {canScheduleMaintenance && (
            <Button size="small" variant="outlined" startIcon={<BuildIcon />} onClick={onScheduleMaintenance}>
              Schedule
            </Button>
          )}
        </Box>
        {maintenanceLogsLoading ? (
          <CircularProgress size={24} />
        ) : maintenanceLogs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" mb={2}>
            No completed maintenance records yet
          </Typography>
        ) : (
          <List dense disablePadding sx={{ mb: 2 }}>
            {maintenanceLogs.map((log) => (
              <ListItem key={log.id} sx={{ px: 0, alignItems: 'flex-start' }}>
                <ListItemText
                  primary={`${log.workOrderNumber} — ${log.title}`}
                  secondary={
                    <>
                      {typeLabels[log.type] || log.type} · {getMechanicNames(log)} · {formatCurrency(log.cost)}
                      {log.completedDate && ` · ${format(new Date(log.completedDate), 'MMM d, yyyy')}`}
                      {log.workPerformed && (
                        <>
                          <br />
                          {log.workPerformed.slice(0, 120)}
                          {log.workPerformed.length > 120 ? '…' : ''}
                        </>
                      )}
                    </>
                  }
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {vehicle.notes && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {vehicle.notes}
            </Typography>
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          History
        </Typography>
        {historyLoading ? (
          <CircularProgress size={24} />
        ) : (
          <List dense disablePadding>
            {history.map((h) => (
              <ListItem key={h._id} sx={{ px: 0, alignItems: 'flex-start' }}>
                <ListItemText
                  primary={h.description}
                  secondary={
                    <>
                      {formatRelativeTime(h.createdAt)}
                      {h.performedBy && ` · ${h.performedBy.firstName} ${h.performedBy.lastName}`}
                    </>
                  }
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
            {history.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No history yet
              </Typography>
            )}
          </List>
        )}

        <Box display="flex" gap={1} mt={3}>
          {canUpdate && (
            <Button variant="contained" onClick={onEdit} fullWidth>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="outlined" color="error" onClick={onDelete} fullWidth>
              Delete
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default VehicleDetailDrawer;
