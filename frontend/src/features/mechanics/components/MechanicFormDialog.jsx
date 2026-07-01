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
import { mechanicSchema } from '../utils/mechanicUtils';
import { MECHANIC_STATUS, MECHANIC_SPECIALIZATIONS, MECHANIC_SPECIALIZATION_LABELS } from '../../../constants';
import { integerInputProps } from '../../../utils/numericInputProps';

const defaultValues = {
  employeeId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  certificationNumber: '',
  certificationExpiry: '',
  specialization: MECHANIC_SPECIALIZATIONS.GENERAL,
  experienceYears: 0,
  status: MECHANIC_STATUS.AVAILABLE,
  performanceScore: 80,
  notes: '',
};

const MechanicFormDialog = ({ open, onClose, onSubmit, mechanic, isLoading }) => {
  const isEdit = Boolean(mechanic);
  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(mechanicSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mechanic) {
      reset({
        employeeId: mechanic.employeeId || '',
        firstName: mechanic.firstName || '',
        lastName: mechanic.lastName || '',
        email: mechanic.email || '',
        phone: mechanic.phone || '',
        certificationNumber: mechanic.certificationNumber || '',
        certificationExpiry: mechanic.certificationExpiry?.split('T')[0] || '',
        specialization: mechanic.specialization || MECHANIC_SPECIALIZATIONS.GENERAL,
        experienceYears: mechanic.experienceYears ?? 0,
        status: mechanic.status || MECHANIC_STATUS.AVAILABLE,
        performanceScore: mechanic.performanceScore ?? 80,
        notes: mechanic.notes || '',
      });
    } else {
      reset(defaultValues);
    }
  }, [mechanic, reset, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{isEdit ? 'Edit Mechanic' : 'Add New Mechanic'}</DialogTitle>
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
                {Object.values(MECHANIC_STATUS).map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                    {s.replace('_', ' ')}
                  </MenuItem>
                ))}
              </FormTextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Certification & Experience
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormTextField name="certificationNumber" control={control} label="Certification Number *" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField
                name="certificationExpiry"
                control={control}
                label="Certification Expiry *"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormTextField name="specialization" control={control} label="Specialization" select>
                {Object.values(MECHANIC_SPECIALIZATIONS).map((s) => (
                  <MenuItem key={s} value={s}>
                    {MECHANIC_SPECIALIZATION_LABELS[s] || s}
                  </MenuItem>
                ))}
              </FormTextField>
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
          <FormTextField name="notes" control={control} label="Notes" multiline rows={3} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEdit ? 'Update Mechanic' : 'Create Mechanic'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default MechanicFormDialog;
