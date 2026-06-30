import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  MAINTENANCE_TYPE,
  MAINTENANCE_PRIORITY,
} from '../utils/maintenanceUtils';

const defaultValues = {
  vehicleId: '',
  title: '',
  description: '',
  type: MAINTENANCE_TYPE.PREVENTIVE,
  priority: MAINTENANCE_PRIORITY.MEDIUM,
  scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  assignedMechanicIds: [],
  serviceProvider: '',
  notes: '',
};

const MaintenanceFormDialog = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  vehicles = [],
  mechanics = [],
  presetVehicleId,
}) => {
  const isEdit = Boolean(initialData?.id);

  const { control, register, handleSubmit, reset } = useForm({ defaultValues });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          vehicleId: initialData.vehicle?.id || '',
          title: initialData.title || '',
          description: initialData.description || '',
          type: initialData.type || MAINTENANCE_TYPE.PREVENTIVE,
          priority: initialData.priority || MAINTENANCE_PRIORITY.MEDIUM,
          scheduledDate: initialData.scheduledDate
            ? new Date(initialData.scheduledDate).toISOString().slice(0, 16)
            : defaultValues.scheduledDate,
          assignedMechanicIds: initialData.assignedMechanics?.length
            ? initialData.assignedMechanics.map((m) => m.id)
            : initialData.assignedMechanic?.id
              ? [initialData.assignedMechanic.id]
              : [],
          serviceProvider: initialData.serviceProvider || '',
          notes: initialData.notes || '',
        });
      } else {
        reset({
          ...defaultValues,
          vehicleId: presetVehicleId || '',
        });
      }
    }
  }, [open, initialData, presetVehicleId, reset]);

  const submit = (data) => {
    onSubmit({
      vehicleId: data.vehicleId,
      title: data.title,
      description: data.description || '',
      type: data.type,
      priority: data.priority,
      scheduledDate: new Date(data.scheduledDate).toISOString(),
      assignedMechanicIds: data.assignedMechanicIds || [],
      serviceProvider: data.serviceProvider || '',
      notes: data.notes || '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Work Order' : 'Schedule Maintenance'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="vehicleId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Vehicle" required disabled={Boolean(presetVehicleId)}>
                    {vehicles.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.vehicleNumber} — {v.manufacturer} {v.model}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="assignedMechanicIds"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={mechanics}
                    getOptionLabel={(option) => option.name}
                    value={mechanics.filter((m) => field.value?.includes(m.id))}
                    onChange={(_, value) => field.onChange(value.map((m) => m.id))}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" />
                      ))
                    }
                    renderInput={(params) => <TextField {...params} label="Assign Mechanics (optional)" />}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issue / Problem Title"
                placeholder="e.g. Brake pads worn, engine warning light"
                {...register('title', { required: true })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Problem Description"
                multiline
                rows={3}
                placeholder="Describe the issue, symptoms, or service needed"
                {...register('description')}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Service Type">
                    {Object.values(MAINTENANCE_TYPE).map((t) => (
                      <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Priority">
                    {Object.values(MAINTENANCE_PRIORITY).map((p) => (
                      <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Scheduled Date"
                InputLabelProps={{ shrink: true }}
                {...register('scheduledDate', { required: true })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="External Service Provider (optional)" {...register('serviceProvider')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Scheduling Notes" multiline rows={2} {...register('notes')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isEdit ? 'Save Changes' : 'Schedule Maintenance'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MaintenanceFormDialog;
