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
  Typography,
  Divider,
} from '@mui/material';
import AddressAutocomplete from '../../maps/components/AddressAutocomplete';
import { useDrivingDistance } from '../../maps/hooks/useDrivingDistance';
import { distanceInputProps, moneyInputProps } from '../../../utils/numericInputProps';

const defaultValues = {
  driverId: '',
  vehicleId: '',
  routeId: '',
  scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  originAddress: '',
  originLat: '',
  originLng: '',
  destinationAddress: '',
  destinationLat: '',
  destinationLng: '',
  distance: '',
  estimatedCost: '',
  notes: '',
};

const applyPlaceToFields = (setValue, prefix, place) => {
  setValue(`${prefix}Address`, place.address, { shouldDirty: true });
  setValue(`${prefix}Lat`, place.location.lat, { shouldDirty: true });
  setValue(`${prefix}Lng`, place.location.lng, { shouldDirty: true });
};

const normalizeId = (id) => (id == null || id === '' ? '' : String(id));

const TripFormDialog = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  drivers = [],
  vehicles = [],
  routes = [],
}) => {
  const isEdit = Boolean(initialData?.id);

  const { control, register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues });
  const selectedRouteId = watch('routeId');
  const originLat = watch('originLat');
  const originLng = watch('originLng');
  const destinationLat = watch('destinationLat');
  const destinationLng = watch('destinationLng');

  const { distanceKm, loading: distanceLoading } = useDrivingDistance(
    { lat: originLat, lng: originLng },
    { lat: destinationLat, lng: destinationLng },
    open
  );

  useEffect(() => {
    if (distanceKm != null) {
      setValue('distance', distanceKm, { shouldDirty: true });
    }
  }, [distanceKm, setValue]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          driverId: initialData.driver?.id || '',
          vehicleId: initialData.vehicle?.id || '',
          routeId: initialData.route?.id || '',
          scheduledAt: initialData.scheduledAt
            ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
            : defaultValues.scheduledAt,
          originAddress: initialData.origin?.address || '',
          originLat: initialData.origin?.lat ?? '',
          originLng: initialData.origin?.lng ?? '',
          destinationAddress: initialData.destination?.address || '',
          destinationLat: initialData.destination?.lat ?? '',
          destinationLng: initialData.destination?.lng ?? '',
          distance: initialData.distance ?? '',
          estimatedCost: initialData.estimatedCost ?? '',
          notes: initialData.notes || '',
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, initialData, reset]);

  useEffect(() => {
    if (!selectedRouteId || isEdit) return;
    const route = routes.find((r) => r.id === selectedRouteId);
    if (!route) return;
    setValue('originAddress', route.origin?.address || '');
    setValue('originLat', route.origin?.lat ?? '');
    setValue('originLng', route.origin?.lng ?? '');
    setValue('destinationAddress', route.destination?.address || '');
    setValue('destinationLat', route.destination?.lat ?? '');
    setValue('destinationLng', route.destination?.lng ?? '');
    if (route.totalDistanceMeters) {
      setValue('distance', Math.round((route.totalDistanceMeters / 1000) * 100) / 100);
    }
  }, [selectedRouteId, routes, setValue, isEdit]);

  const handleDriverChange = (driverId, fieldOnChange) => {
    fieldOnChange(driverId);
    if (!driverId) return;

    const driver = drivers.find((d) => normalizeId(d.id) === normalizeId(driverId));
    const assignedVehicleId = normalizeId(driver?.assignedVehicleId);
    if (assignedVehicleId) {
      setValue('vehicleId', assignedVehicleId, { shouldDirty: true });
    }
  };

  const handleVehicleChange = (vehicleId, fieldOnChange) => {
    fieldOnChange(vehicleId);
    if (!vehicleId) return;

    const vehicle = vehicles.find((v) => normalizeId(v.id) === normalizeId(vehicleId));
    const assignedDriverId = normalizeId(vehicle?.assignedDriverId);
    if (assignedDriverId) {
      setValue('driverId', assignedDriverId, { shouldDirty: true });
    }
  };

  const submit = (data) => {
    onSubmit({
      id: initialData?.id,
      driverId: data.driverId,
      vehicleId: data.vehicleId,
      routeId: data.routeId || null,
      scheduledAt: new Date(data.scheduledAt).toISOString(),
      origin: {
        address: data.originAddress,
        lat: Number(data.originLat || 0),
        lng: Number(data.originLng || 0),
      },
      destination: {
        address: data.destinationAddress,
        lat: Number(data.destinationLat || 0),
        lng: Number(data.destinationLng || 0),
      },
      distance: Number(data.distance || 0),
      estimatedCost: Number(data.estimatedCost || 0),
      notes: data.notes,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus>
      <DialogTitle>{isEdit ? 'Edit Trip' : 'Create Trip'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="driverId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Driver"
                    required
                    disabled={isEdit && initialData?.status !== 'scheduled'}
                    onChange={(e) => handleDriverChange(e.target.value, field.onChange)}
                  >
                    {drivers.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name} ({d.status.replace('_', ' ')})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="vehicleId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Vehicle"
                    required
                    disabled={isEdit && initialData?.status !== 'scheduled'}
                    onChange={(e) => handleVehicleChange(e.target.value, field.onChange)}
                  >
                    {vehicles.map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.vehicleNumber} — {v.model}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="routeId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Route Template (optional)" disabled={isEdit && initialData?.status !== 'scheduled'}>
                    <MenuItem value="">None — manual origin/destination</MenuItem>
                    {routes.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.routeNumber} — {r.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Scheduled At"
                InputLabelProps={{ shrink: true }}
                {...register('scheduledAt', { required: true })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="distance"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Distance (km)"
                    inputProps={distanceInputProps()}
                    value={field.value ?? ''}
                    helperText={
                      distanceLoading
                        ? 'Calculating driving distance…'
                        : 'Auto-filled from origin and destination when available'
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="estimatedCost"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Estimated Trip Cost ($)"
                    inputProps={moneyInputProps()}
                    value={field.value ?? ''}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Origin
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="originAddress"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    label="Origin Address"
                    value={field.value || ''}
                    onChange={field.onChange}
                    inputKey={`trip-origin-${open}`}
                    onPlaceSelect={(place) => applyPlaceToFields(setValue, 'origin', place)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="originLat"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Latitude"
                    inputProps={{ step: 'any' }}
                    value={field.value ?? ''}
                    helperText="Auto-filled when you pick an address"
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="originLng"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Longitude"
                    inputProps={{ step: 'any' }}
                    value={field.value ?? ''}
                    helperText="Auto-filled when you pick an address"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Destination
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="destinationAddress"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    label="Destination Address"
                    value={field.value || ''}
                    onChange={field.onChange}
                    inputKey={`trip-destination-${open}`}
                    onPlaceSelect={(place) => applyPlaceToFields(setValue, 'destination', place)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="destinationLat"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Latitude"
                    inputProps={{ step: 'any' }}
                    value={field.value ?? ''}
                    helperText="Auto-filled when you pick an address"
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="destinationLng"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Longitude"
                    inputProps={{ step: 'any' }}
                    value={field.value ?? ''}
                    helperText="Auto-filled when you pick an address"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Trip Detail" multiline rows={2} {...register('notes')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isEdit ? 'Save' : 'Create Trip'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TripFormDialog;
