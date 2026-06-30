import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Switch,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaceIcon from '@mui/icons-material/Place';
import { useSnackbar } from 'notistack';
import { decimalInputProps } from '../../../utils/numericInputProps';
import {
  useGetGeofencesQuery,
  useCreateGeofenceMutation,
  useUpdateGeofenceMutation,
  useDeleteGeofenceMutation,
} from '../../../redux/api/trackingApi';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../constants';

const defaultForm = {
  name: '',
  description: '',
  radius: 500,
  color: '#1565C0',
  alertOnEnter: true,
  alertOnExit: true,
  center: null,
};

const GeofencePanel = ({ placementMode, onTogglePlacement, pendingCenter, onClearPendingCenter }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.MANAGE_GEOFENCES);

  const { data, isLoading } = useGetGeofencesQuery({ limit: 50 });
  const [createGeofence, { isLoading: isCreating }] = useCreateGeofenceMutation();
  const [updateGeofence] = useUpdateGeofenceMutation();
  const [deleteGeofence] = useDeleteGeofenceMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (pendingCenter) {
      setForm((f) => ({ ...f, center: pendingCenter }));
    }
  }, [pendingCenter]);

  const geofences = data?.data?.geofences || [];

  const openCreateDialog = () => {
    setForm({ ...defaultForm, center: pendingCenter });
    setDialogOpen(true);
    if (!placementMode) onTogglePlacement?.(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar('Geofence name is required', { variant: 'warning' });
      return;
    }
    if (!form.center) {
      enqueueSnackbar('Click the map to set geofence center', { variant: 'warning' });
      return;
    }

    try {
      await createGeofence({
        name: form.name.trim(),
        description: form.description,
        type: 'circle',
        center: form.center,
        radius: Number(form.radius),
        color: form.color,
        alertOnEnter: form.alertOnEnter,
        alertOnExit: form.alertOnExit,
      }).unwrap();
      enqueueSnackbar('Geofence created', { variant: 'success' });
      setDialogOpen(false);
      setForm(defaultForm);
      onTogglePlacement?.(false);
      onClearPendingCenter?.();
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Failed to create geofence', { variant: 'error' });
    }
  };

  const handleToggleActive = async (geofence) => {
    try {
      await updateGeofence({ id: geofence.id, isActive: !geofence.isActive }).unwrap();
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Failed to update geofence', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteGeofence(id).unwrap();
      enqueueSnackbar('Geofence deleted', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Failed to delete geofence', { variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            Geofences
          </Typography>
          {canManage && (
            <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={openCreateDialog}>
              Add
            </Button>
          )}
        </Box>

        {geofences.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No geofences configured. Add a circular geofence to monitor entry and exit events.
          </Typography>
        ) : (
          <List dense disablePadding>
            {geofences.map((geofence) => (
              <ListItem
                key={geofence.id}
                secondaryAction={
                  canManage && (
                    <Box>
                      <Switch
                        edge="end"
                        size="small"
                        checked={geofence.isActive}
                        onChange={() => handleToggleActive(geofence)}
                      />
                      <IconButton edge="end" size="small" onClick={() => handleDelete(geofence.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )
                }
                sx={{ px: 0 }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: geofence.color || '#1565C0',
                        }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {geofence.name}
                      </Typography>
                      {!geofence.isActive && <Chip label="Inactive" size="small" />}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {geofence.type} · {geofence.radius}m radius
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Geofence</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            margin="normal"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Description"
            margin="normal"
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Radius (meters)"
            type="number"
            margin="normal"
            inputProps={decimalInputProps()}
            value={form.radius}
            onChange={(e) => setForm((f) => ({ ...f, radius: e.target.value }))}
          />
          <TextField
            fullWidth
            label="Color"
            type="color"
            margin="normal"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
          />
          <Box mt={2}>
            <Tooltip title="Click on the map to set center">
              <Button
                variant={placementMode ? 'contained' : 'outlined'}
                startIcon={<PlaceIcon />}
                onClick={() => onTogglePlacement?.(!placementMode)}
              >
                {form.center
                  ? `Center: ${form.center.lat.toFixed(4)}, ${form.center.lng.toFixed(4)}`
                  : 'Set center on map'}
              </Button>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={isCreating}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default GeofencePanel;
