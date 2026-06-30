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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { FUEL_TYPES, fuelTypeLabels } from '../utils/fuelUtils';
import { decimalInputProps, moneyInputProps } from '../../../utils/numericInputProps';

const defaultValues = {
  vehicleId: '',
  driverId: '',
  stationId: '',
  quantity: '',
  pricePerUnit: '',
  odometer: '',
  fuelType: FUEL_TYPES.DIESEL,
  receiptNumber: '',
  isFullTank: true,
  notes: '',
  loggedAt: new Date().toISOString().slice(0, 16),
};

const FuelLogFormDialog = ({ open, onClose, onSubmit, initialData, isLoading, vehicles = [], stations = [] }) => {
  const isEdit = Boolean(initialData?.id);

  const { control, register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues });

  const quantity = watch('quantity');
  const pricePerUnit = watch('pricePerUnit');

  useEffect(() => {
    if (open) {
      if (initialData) {
        const qty = initialData.quantity ?? '';
        const ppu =
          initialData.pricePerUnit ??
          (qty && initialData.cost ? Number(initialData.cost) / Number(qty) : '');
        reset({
          vehicleId: initialData.vehicle?.id || '',
          driverId: initialData.driver?.id || '',
          stationId: initialData.station?.id || '',
          quantity: qty,
          pricePerUnit: ppu !== '' ? Number(ppu).toFixed(2) : '',
          odometer: initialData.odometer ?? '',
          fuelType: initialData.fuelType || FUEL_TYPES.DIESEL,
          receiptNumber: initialData.receiptNumber || '',
          isFullTank: initialData.isFullTank !== false,
          notes: initialData.notes || '',
          loggedAt: initialData.loggedAt
            ? new Date(initialData.loggedAt).toISOString().slice(0, 16)
            : defaultValues.loggedAt,
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, initialData, reset]);

  const handleVehicleChange = (vehicleId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      setValue('fuelType', vehicle.fuelType || FUEL_TYPES.DIESEL);
      setValue('odometer', vehicle.odometer ?? '');
      if (vehicle.driver?.id) setValue('driverId', vehicle.driver.id);
    }
  };

  const submit = (data) => {
    const qty = Number(data.quantity);
    const ppu = Number(data.pricePerUnit);
    onSubmit({
      ...data,
      vehicleId: data.vehicleId,
      driverId: data.driverId || null,
      stationId: data.stationId || null,
      quantity: qty,
      cost: Math.round(qty * ppu * 100) / 100,
      pricePerUnit: ppu,
      odometer: Number(data.odometer || 0),
      loggedAt: data.loggedAt ? new Date(data.loggedAt).toISOString() : undefined,
    });
  };

  const calculatedCost =
    quantity && pricePerUnit
      ? (Number(quantity) * Number(pricePerUnit)).toFixed(2)
      : '—';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Fuel Log' : 'Log Fuel Purchase'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="vehicleId"
                control={control}
                rules={{ required: 'Vehicle is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Vehicle"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    onChange={(e) => {
                      field.onChange(e);
                      handleVehicleChange(e.target.value);
                    }}
                  >
                    {vehicles.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.vehicleNumber} — {v.manufacturer} {v.model}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="stationId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Fuel Station">
                    <MenuItem value="">None / Other</MenuItem>
                    {stations.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name} {s.city ? `(${s.city})` : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity (L)"
                inputProps={moneyInputProps(0.01)}
                {...register('quantity', { required: true, min: 0.01 })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Price per Unit ($)"
                inputProps={moneyInputProps()}
                {...register('pricePerUnit', { required: true, min: 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cost ($)"
                value={calculatedCost === '—' ? '—' : `$${calculatedCost}`}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="fuelType"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Fuel Type">
                    {Object.values(FUEL_TYPES).map((t) => (
                      <MenuItem key={t} value={t}>
                        {fuelTypeLabels[t]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Odometer (km)"
                inputProps={decimalInputProps()}
                helperText="Required for mileage — uses vehicle odometer if left blank"
                {...register('odometer', { min: 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Receipt Number" {...register('receiptNumber')} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Logged At"
                InputLabelProps={{ shrink: true }}
                {...register('loggedAt')}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="isFullTank"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Full tank (used for mileage calculation)"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2} {...register('notes')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isEdit ? 'Save' : 'Log Fuel'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FuelLogFormDialog;
