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
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { ROUTE_STATUS, ROUTE_STOP_TYPES } from '../utils/routeUtils';
import AddressAutocomplete from '../../maps/components/AddressAutocomplete';
import { decimalInputProps, integerInputProps } from '../../../utils/numericInputProps';

const defaultStop = () => ({
  name: '',
  address: '',
  lat: '',
  lng: '',
  stopType: ROUTE_STOP_TYPES.WAYPOINT,
  estimatedDurationMinutes: 15,
  notes: '',
});

const defaultValues = {
  name: '',
  description: '',
  status: ROUTE_STATUS.DRAFT,
  averageSpeedKmh: 45,
  origin: { address: '', lat: '', lng: '' },
  destination: { address: '', lat: '', lng: '' },
  stops: [defaultStop()],
  notes: '',
};

const applyPlaceToFields = (setValue, getValues, basePath, place, { fillName = false } = {}) => {
  setValue(`${basePath}.address`, place.address, { shouldDirty: true });
  setValue(`${basePath}.lat`, place.location.lat, { shouldDirty: true });
  setValue(`${basePath}.lng`, place.location.lng, { shouldDirty: true });
  if (fillName && place.name && !getValues(`${basePath}.name`)?.trim()) {
    setValue(`${basePath}.name`, place.name, { shouldDirty: true });
  }
};

const RouteFormDialog = ({ open, onClose, onSubmit, initialData, isLoading }) => {
  const isEdit = Boolean(initialData?.id);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues });

  const { fields, append, remove } = useFieldArray({ control, name: 'stops' });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name || '',
          description: initialData.description || '',
          status: initialData.status || ROUTE_STATUS.DRAFT,
          averageSpeedKmh: initialData.averageSpeedKmh || 45,
          origin: {
            address: initialData.origin?.address || '',
            lat: initialData.origin?.lat ?? '',
            lng: initialData.origin?.lng ?? '',
          },
          destination: {
            address: initialData.destination?.address || '',
            lat: initialData.destination?.lat ?? '',
            lng: initialData.destination?.lng ?? '',
          },
          stops: initialData.stops?.length
            ? initialData.stops.map((s) => ({
                name: s.name,
                address: s.address || '',
                lat: s.lat ?? '',
                lng: s.lng ?? '',
                stopType: s.stopType || ROUTE_STOP_TYPES.WAYPOINT,
                estimatedDurationMinutes: s.estimatedDurationMinutes ?? 15,
                notes: s.notes || '',
              }))
            : [defaultStop()],
          notes: initialData.notes || '',
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, initialData, reset]);

  const submit = (data) => {
    const payload = {
      ...data,
      stops: data.stops.map((s, i) => ({
        ...s,
        sequence: i + 1,
        lat: Number(s.lat),
        lng: Number(s.lng),
        estimatedDurationMinutes: Number(s.estimatedDurationMinutes),
      })),
      origin: { ...data.origin, lat: Number(data.origin.lat), lng: Number(data.origin.lng) },
      destination: {
        ...data.destination,
        lat: Number(data.destination.lat),
        lng: Number(data.destination.lng),
      },
      averageSpeedKmh: Number(data.averageSpeedKmh),
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus>
      <DialogTitle>{isEdit ? 'Edit Route' : 'Create Route'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Route Name"
                {...register('name', { required: 'Name is required' })}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField fullWidth select label="Status" {...field}>
                    {Object.values(ROUTE_STATUS).map((s) => (
                      <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} {...register('description')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Avg Speed (km/h)"
                inputProps={decimalInputProps(5)}
                {...register('averageSpeedKmh', { min: 5, max: 150 })}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} mt={3} mb={1}>
            Origin
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="origin.address"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    label="Address"
                    value={field.value || ''}
                    onChange={field.onChange}
                    inputKey={`origin-${open}`}
                    onPlaceSelect={(place) => applyPlaceToFields(setValue, getValues, 'origin', place)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="origin.lat"
                control={control}
                rules={{ required: 'Latitude is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Latitude"
                    inputProps={{ step: 'any' }}
                    value={field.value ?? ''}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || 'Auto-filled when you pick an address'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="origin.lng"
                control={control}
                rules={{ required: 'Longitude is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Longitude"
                    inputProps={{ step: 'any' }}
                    value={field.value ?? ''}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || 'Auto-filled when you pick an address'}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} mt={3} mb={1}>
            Stops
          </Typography>
          {fields.map((field, index) => (
            <Box key={field.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" fontWeight={600}>
                  Stop {index + 1}
                </Typography>
                {fields.length > 1 && (
                  <IconButton size="small" color="error" onClick={() => remove(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    {...register(`stops.${index}.name`, { required: true })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name={`stops.${index}.stopType`}
                    control={control}
                    render={({ field: f }) => (
                      <TextField fullWidth size="small" select label="Type" {...f}>
                        {Object.values(ROUTE_STOP_TYPES).map((t) => (
                          <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                            {t}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name={`stops.${index}.address`}
                    control={control}
                    render={({ field: addressField }) => (
                      <AddressAutocomplete
                        label="Address"
                        size="small"
                        value={addressField.value || ''}
                        onChange={addressField.onChange}
                        inputKey={`stop-${field.id}`}
                        onPlaceSelect={(place) =>
                          applyPlaceToFields(setValue, getValues, `stops.${index}`, place, { fillName: true })
                        }
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Controller
                    name={`stops.${index}.lat`}
                    control={control}
                    render={({ field: latField }) => (
                      <TextField
                        {...latField}
                        fullWidth
                        size="small"
                        type="number"
                        label="Lat"
                        inputProps={{ step: 'any' }}
                        value={latField.value ?? ''}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Controller
                    name={`stops.${index}.lng`}
                    control={control}
                    render={({ field: lngField }) => (
                      <TextField
                        {...lngField}
                        fullWidth
                        size="small"
                        type="number"
                        label="Lng"
                        inputProps={{ step: 'any' }}
                        value={lngField.value ?? ''}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Duration (min)"
                    inputProps={integerInputProps(0)}
                    {...register(`stops.${index}.estimatedDurationMinutes`)}
                  />
                </Grid>
              </Grid>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} size="small" onClick={() => append(defaultStop())}>
            Add Stop
          </Button>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={700} mb={1}>
            Destination
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="destination.address"
                control={control}
                render={({ field }) => (
                  <AddressAutocomplete
                    label="Address"
                    value={field.value || ''}
                    onChange={field.onChange}
                    inputKey={`destination-${open}`}
                    onPlaceSelect={(place) => applyPlaceToFields(setValue, getValues, 'destination', place)}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="destination.lat"
                control={control}
                rules={{ required: 'Latitude is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Latitude"
                    inputProps={{ step: 'any' }}
                    value={field.value ?? ''}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || 'Auto-filled when you pick an address'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="destination.lng"
                control={control}
                rules={{ required: 'Longitude is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Longitude"
                    inputProps={{ step: 'any' }}
                    value={field.value ?? ''}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message || 'Auto-filled when you pick an address'}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Route'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RouteFormDialog;
