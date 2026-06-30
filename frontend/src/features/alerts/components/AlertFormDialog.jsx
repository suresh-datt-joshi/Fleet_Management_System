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
} from '@mui/material';
import { ALERT_TYPES, ALERT_SEVERITY, alertTypeLabels, severityLabels } from '../utils/alertUtils';

const defaultValues = {
  type: ALERT_TYPES.LOW_FUEL,
  severity: ALERT_SEVERITY.MEDIUM,
  title: '',
  message: '',
  vehicleId: '',
  driverId: '',
};

const AlertFormDialog = ({ open, onClose, onSubmit, isLoading, vehicles = [], drivers = [] }) => {
  const { control, register, handleSubmit, reset } = useForm({ defaultValues });

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, reset]);

  const submit = (data) => {
    onSubmit({
      type: data.type,
      severity: data.severity,
      title: data.title,
      message: data.message,
      vehicleId: data.vehicleId || undefined,
      driverId: data.driverId || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Alert</DialogTitle>
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Alert Type" required>
                    {Object.values(ALERT_TYPES).map((t) => (
                      <MenuItem key={t} value={t}>
                        {alertTypeLabels[t] || t}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Severity" required>
                    {Object.values(ALERT_SEVERITY).map((s) => (
                      <MenuItem key={s} value={s}>
                        {severityLabels[s]}
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
              <TextField fullWidth label="Message" multiline rows={3} {...register('message', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="vehicleId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Vehicle (optional)">
                    <MenuItem value="">None</MenuItem>
                    {vehicles.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.vehicleNumber}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="driverId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Driver (optional)">
                    <MenuItem value="">None</MenuItem>
                    {drivers.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            Create Alert
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AlertFormDialog;
