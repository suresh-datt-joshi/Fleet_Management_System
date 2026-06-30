import { useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, InputAdornment, Link, Stack, TextField, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import FormTextField from '../../components/forms/FormTextField';
import { resetPasswordSchema } from '../../utils/validationSchemas';
import { useResetPasswordMutation } from '../../redux/api/authApi';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const email = location.state?.email || '';
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: { otp: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...payload } = data;
      await resetPassword({ ...payload, email }).unwrap();
      enqueueSnackbar('Password reset successful!', { variant: 'success' });
      navigate('/dashboard');
    } catch (error) {
      enqueueSnackbar(error?.data?.message || 'Reset failed', { variant: 'error' });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Controller
          name="otp"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              fullWidth
              label="Reset Code"
              placeholder="000000"
              inputProps={{ maxLength: 6, style: { letterSpacing: 8, textAlign: 'center', fontSize: 24 } }}
              error={!!error}
              helperText={error?.message}
              margin="normal"
            />
          )}
        />
        <FormTextField
          name="password"
          control={control}
          label="New Password"
          type="password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormTextField name="confirmPassword" control={control} label="Confirm Password" type="password" />

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={isLoading}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>

        <Stack direction="row" justifyContent="center" mt={3}>
          <Link component={RouterLink} to="/login" variant="body2">
            Back to login
          </Link>
        </Stack>
      </Box>
  );
};

export default ResetPasswordPage;
