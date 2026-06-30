import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  MenuItem,
  Box,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import FormTextField from '../../../components/forms/FormTextField';
import { driverSchema } from '../utils/driverUtils';
import { DRIVER_STATUS } from '../../../constants';
import { integerInputProps } from '../../../utils/numericInputProps';

const defaultValues = {
  employeeId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  licenseNumber: '',
  licenseExpiry: '',
  experienceYears: 0,
  medicalCertificateExpiry: '',
  status: DRIVER_STATUS.AVAILABLE,
  performanceScore: 80,
  notes: '',
  emergencyContact: { name: '', phone: '', relation: '' },
};

const DriverFormDialog = ({ open, onClose, onSubmit, driver, isLoading }) => {
  const isEdit = Boolean(driver);
  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(driverSchema),
    defaultValues,
  });

  useEffect(() => {
    if (driver) {
      reset({
        employeeId: driver.employeeId || '',
        firstName: driver.firstName || '',
        lastName: driver.lastName || '',
        email: driver.email || '',
        phone: driver.phone || '',
        licenseNumber: driver.licenseNumber || '',
        licenseExpiry: driver.licenseExpiry?.split('T')[0] || '',
        experienceYears: driver.experienceYears ?? 0,
        medicalCertificateExpiry: driver.medicalCertificateExpiry?.split('T')[0] || '',
        status: driver.status || DRIVER_STATUS.AVAILABLE,
        performanceScore: driver.performanceScore ?? 80,
        notes: driver.notes || '',
        emergencyContact: {
          name: driver.emergencyContact?.name || '',
          phone: driver.emergencyContact?.phone || '',
          relation: driver.emergencyContact?.relation || '',
        },
      });
    } else {
      reset(defaultValues);
    }
  }, [driver, reset, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{isEdit ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Personal Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormTextField name="firstName" control={control} label="First Name *" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="lastName" control={control} label="Last Name *" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="employeeId" control={control} label="Employee ID" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="email" control={control} label="Email" type="email" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="phone" control={control} label="Phone" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="status" control={control} label="Status" select>
                {Object.values(DRIVER_STATUS).map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                    {s.replace('_', ' ')}
                  </MenuItem>
                ))}
              </FormTextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="primary" gutterBottom>
            License & Experience
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormTextField name="licenseNumber" control={control} label="License Number *" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="licenseExpiry" control={control} label="License Expiry *" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="medicalCertificateExpiry" control={control} label="Medical Certificate Expiry" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormTextField
                name="experienceYears"
                control={control}
                label="Experience (years)"
                type="number"
                inputProps={integerInputProps(0)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormTextField
                name="performanceScore"
                control={control}
                label="Performance Score"
                type="number"
                inputProps={integerInputProps(0, 100)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Emergency Contact
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormTextField name="emergencyContact.name" control={control} label="Contact Name" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormTextField name="emergencyContact.phone" control={control} label="Contact Phone" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormTextField name="emergencyContact.relation" control={control} label="Relation" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <FormTextField name="notes" control={control} label="Notes" multiline rows={3} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEdit ? 'Update Driver' : 'Create Driver'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default DriverFormDialog;
