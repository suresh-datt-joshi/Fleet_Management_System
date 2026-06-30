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
import { USER_ROLES, ROLE_LABELS } from '../../../constants';

const defaultValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  role: USER_ROLES.DISPATCHER,
  isActive: true,
};

const UserFormDialog = ({ open, onClose, onSubmit, initialData, isLoading, actorRole }) => {
  const isEdit = Boolean(initialData?.id);

  const { control, register, handleSubmit, reset } = useForm({ defaultValues });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          email: initialData.email || '',
          password: '',
          phone: initialData.phone || '',
          role: initialData.role || USER_ROLES.DISPATCHER,
          isActive: initialData.isActive !== false,
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, initialData, reset]);

  const submit = (data) => {
    const payload = { ...data };
    if (isEdit) delete payload.password;
    onSubmit(payload);
  };

  const availableRoles = Object.values(USER_ROLES).filter(
    (r) => actorRole === USER_ROLES.SUPER_ADMIN || r !== USER_ROLES.SUPER_ADMIN
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" {...register('firstName', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" {...register('lastName', { required: true })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" {...register('email', { required: true })} />
            </Grid>
            {!isEdit && (
              <Grid item xs={12}>
                <TextField fullWidth label="Password" type="password" {...register('password', { required: !isEdit })} />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" {...register('phone')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth select label="Role">
                    {availableRoles.map((r) => (
                      <MenuItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Active" />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isEdit ? 'Save' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserFormDialog;
