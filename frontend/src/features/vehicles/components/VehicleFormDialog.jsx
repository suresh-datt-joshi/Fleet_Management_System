import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  MenuItem,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import FormTextField from '../../../components/forms/FormTextField';
import { vehicleSchema } from '../utils/vehicleUtils';
import { VEHICLE_STATUS } from '../../../constants';
import { decimalInputProps, integerInputProps } from '../../../utils/numericInputProps';

const defaultValues = {
  vehicleNumber: '',
  vin: '',
  manufacturer: '',
  model: '',
  year: new Date().getFullYear(),
  status: VEHICLE_STATUS.ACTIVE,
  fuelType: 'diesel',
  fuelLevel: 100,
  odometer: 0,
  registrationNumber: '',
  notes: '',
  documentExpiry: {
    insurance: '',
    registration: '',
    fitness: '',
    emission: '',
    permit: '',
  },
};

const VehicleFormDialog = ({ open, onClose, onSubmit, vehicle, isLoading }) => {
  const isEdit = Boolean(vehicle);

  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(vehicleSchema),
    defaultValues,
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        vehicleNumber: vehicle.vehicleNumber || '',
        vin: vehicle.vin || '',
        manufacturer: vehicle.manufacturer || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        status: vehicle.status || VEHICLE_STATUS.ACTIVE,
        fuelType: vehicle.fuelType || 'diesel',
        fuelLevel: vehicle.fuelLevel ?? 100,
        odometer: vehicle.odometer ?? 0,
        registrationNumber: vehicle.registrationNumber || '',
        notes: vehicle.notes || '',
        documentExpiry: {
          insurance: vehicle.documentExpiry?.insurance?.split('T')[0] || '',
          registration: vehicle.documentExpiry?.registration?.split('T')[0] || '',
          fitness: vehicle.documentExpiry?.fitness?.split('T')[0] || '',
          emission: vehicle.documentExpiry?.emission?.split('T')[0] || '',
          permit: vehicle.documentExpiry?.permit?.split('T')[0] || '',
        },
      });
    } else {
      reset(defaultValues);
    }
  }, [vehicle, reset, open]);

  const handleFormSubmit = (data) => {
    const payload = { ...data };
    Object.keys(payload.documentExpiry).forEach((key) => {
      if (!payload.documentExpiry[key]) payload.documentExpiry[key] = null;
    });
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <DialogContent dividers>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Basic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormTextField name="vehicleNumber" control={control} label="Vehicle Number *" disabled={isEdit} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="vin" control={control} label="VIN" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="manufacturer" control={control} label="Manufacturer *" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="model" control={control} label="Model *" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormTextField
                name="year"
                control={control}
                label="Year"
                type="number"
                inputProps={integerInputProps(1990, 2100)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormTextField name="status" control={control} label="Status" select>
                {Object.values(VEHICLE_STATUS).map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                    {s}
                  </MenuItem>
                ))}
              </FormTextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormTextField name="fuelType" control={control} label="Fuel Type" select>
                {['petrol', 'diesel', 'electric', 'cng', 'hybrid'].map((f) => (
                  <MenuItem key={f} value={f} sx={{ textTransform: 'capitalize' }}>
                    {f}
                  </MenuItem>
                ))}
              </FormTextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="registrationNumber" control={control} label="RC / Registration Number" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormTextField
                name="odometer"
                control={control}
                label="Odometer (km)"
                type="number"
                inputProps={decimalInputProps()}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormTextField
                name="fuelLevel"
                control={control}
                label="Fuel Level (%)"
                type="number"
                inputProps={{ min: 0, max: 100, step: 1 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Document Expiry Dates
          </Typography>
          <Grid container spacing={2}>
            {['insurance', 'registration', 'fitness', 'emission', 'permit'].map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc}>
                <FormTextField
                  name={`documentExpiry.${doc}`}
                  control={control}
                  label={doc.charAt(0).toUpperCase() + doc.slice(1)}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />
          <FormTextField name="notes" control={control} label="Notes" multiline rows={3} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Create Vehicle'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default VehicleFormDialog;
