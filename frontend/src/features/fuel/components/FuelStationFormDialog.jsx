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
  Chip,
  Box,
} from '@mui/material';
import AddressAutocomplete from '../../maps/components/AddressAutocomplete';
import { FUEL_TYPES, FUEL_STATION_STATUS, fuelTypeLabels } from '../utils/fuelUtils';

const applyPlaceToFields = (setValue, getValues, place) => {
  setValue('address', place.address, { shouldDirty: true });
  setValue('lat', place.location.lat, { shouldDirty: true });
  setValue('lng', place.location.lng, { shouldDirty: true });
  if (place.addressComponents?.city) {
    setValue('city', place.addressComponents.city, { shouldDirty: true });
  }
  if (place.addressComponents?.state) {
    setValue('state', place.addressComponents.state, { shouldDirty: true });
  }
  if (place.addressComponents?.zipCode) {
    setValue('zipCode', place.addressComponents.zipCode, { shouldDirty: true });
  }
  if (place.name && !getValues('name')?.trim()) {
    setValue('name', place.name, { shouldDirty: true });
  }
};

const defaultValues = {
  name: '',
  brand: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  lat: 40.7128,
  lng: -74.006,
  fuelTypes: [FUEL_TYPES.DIESEL],
  status: FUEL_STATION_STATUS.ACTIVE,
  notes: '',
};

const FuelStationFormDialog = ({ open, onClose, onSubmit, initialData, isLoading }) => {
  const isEdit = Boolean(initialData?.id);
  const { control, register, handleSubmit, reset, setValue, getValues } = useForm({ defaultValues });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name || '',
          brand: initialData.brand || '',
          address: initialData.address || '',
          city: initialData.city || '',
          state: initialData.state || '',
          zipCode: initialData.zipCode || '',
          phone: initialData.phone || '',
          lat: initialData.location?.lat ?? 40.7128,
          lng: initialData.location?.lng ?? -74.006,
          fuelTypes: initialData.fuelTypes?.length ? initialData.fuelTypes : [FUEL_TYPES.DIESEL],
          status: initialData.status || FUEL_STATION_STATUS.ACTIVE,
          notes: initialData.notes || '',
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, initialData, reset]);

  const submit = (data) => {
    onSubmit({
      name: data.name,
      brand: data.brand,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      phone: data.phone,
      location: { lat: Number(data.lat), lng: Number(data.lng) },
      fuelTypes: data.fuelTypes,
      status: data.status,
      notes: data.notes,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Fuel Station' : 'Add Fuel Station'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Station Name" {...register('name', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Brand" {...register('brand')} />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    label="Address"
                    value={field.value || ''}
                    onChange={field.onChange}
                    inputKey={`fuel-station-${initialData?.id || 'new'}-${open}`}
                    onPlaceSelect={(place) => applyPlaceToFields(setValue, getValues, place)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="City" {...register('city')} />
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label="State" {...register('state')} />
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label="Zip" {...register('zipCode')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Phone" {...register('phone')} />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Latitude"
                inputProps={{ step: 'any' }}
                {...register('lat')}
                helperText="Auto-filled when you pick an address"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Longitude"
                inputProps={{ step: 'any' }}
                {...register('lng')}
                helperText="Auto-filled when you pick an address"
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="fuelTypes"
                control={control}
                render={({ field }) => (
                  <Box>
                    <TextField
                      select
                      fullWidth
                      label="Fuel Types"
                      SelectProps={{ multiple: true }}
                      value={field.value}
                      onChange={field.onChange}
                      renderValue={(selected) => (
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {selected.map((v) => (
                            <Chip key={v} label={fuelTypeLabels[v]} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {Object.values(FUEL_TYPES).map((t) => (
                        <MenuItem key={t} value={t}>
                          {fuelTypeLabels[t]}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Status">
                    {Object.values(FUEL_STATION_STATUS).map((s) => (
                      <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
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
            {isEdit ? 'Save' : 'Add Station'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FuelStationFormDialog;
