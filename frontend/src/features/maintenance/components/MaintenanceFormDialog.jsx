import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  MAINTENANCE_TYPE,
  MAINTENANCE_PRIORITY,
} from '../utils/maintenanceUtils';
import { decimalInputProps, integerInputProps, moneyInputProps } from '../../../utils/numericInputProps';

const defaultPart = () => ({ name: '', quantity: 1, cost: 0 });

const defaultValues = {
  vehicleId: '',
  title: '',
  description: '',
  type: MAINTENANCE_TYPE.PREVENTIVE,
  priority: MAINTENANCE_PRIORITY.MEDIUM,
  scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  assignedMechanicId: '',
  odometerAtService: '',
  laborCost: 0,
  serviceProvider: '',
  notes: '',
  parts: [defaultPart()],
};

const MaintenanceFormDialog = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  vehicles = [],
  mechanics = [],
}) => {
  const isEdit = Boolean(initialData?.id);

  const { control, register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues });
  const { fields, append, remove } = useFieldArray({ control, name: 'parts' });

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
          assignedMechanicId: initialData.assignedMechanic?.id || '',
          odometerAtService: initialData.odometerAtService ?? '',
          laborCost: initialData.laborCost ?? 0,
          serviceProvider: initialData.serviceProvider || '',
          notes: initialData.notes || '',
          parts: initialData.parts?.length
            ? initialData.parts.map((p) => ({ name: p.name, quantity: p.quantity, cost: p.cost }))
            : [defaultPart()],
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, initialData, reset]);

  const submit = (data) => {
    onSubmit({
      ...data,
      vehicleId: data.vehicleId,
      assignedMechanicId: data.assignedMechanicId || null,
      odometerAtService: Number(data.odometerAtService || 0),
      laborCost: Number(data.laborCost || 0),
      scheduledDate: new Date(data.scheduledDate).toISOString(),
      parts: data.parts
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name,
          quantity: Number(p.quantity || 1),
          cost: Number(p.cost || 0),
        })),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Work Order' : 'Create Work Order'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="vehicleId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Vehicle" required>
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
                name="assignedMechanicId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Mechanic">
                    <MenuItem value="">Unassigned</MenuItem>
                    {mechanics.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Title" {...register('title', { required: true })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} {...register('description')} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Type">
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
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Odometer (km)"
                inputProps={decimalInputProps()}
                {...register('odometerAtService')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Labor Cost ($)"
                inputProps={moneyInputProps()}
                {...register('laborCost')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Service Provider" {...register('serviceProvider')} />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} mt={2} mb={1}>
            Parts
          </Typography>
          {fields.map((field, index) => (
            <Box key={field.id} display="flex" gap={1} mb={1} alignItems="center">
              <TextField size="small" label="Part Name" {...register(`parts.${index}.name`)} sx={{ flex: 2 }} />
              <TextField
                size="small"
                type="number"
                label="Qty"
                inputProps={integerInputProps(1)}
                {...register(`parts.${index}.quantity`)}
                sx={{ width: 80 }}
              />
              <TextField
                size="small"
                type="number"
                label="Cost"
                inputProps={moneyInputProps()}
                {...register(`parts.${index}.cost`)}
                sx={{ width: 100 }}
              />
              {fields.length > 1 && (
                <IconButton size="small" color="error" onClick={() => remove(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={() => append(defaultPart())}>
            Add Part
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MaintenanceFormDialog;
