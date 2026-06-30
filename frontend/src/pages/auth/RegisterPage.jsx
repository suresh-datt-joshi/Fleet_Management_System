import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import InputAdornment from '@mui/material/InputAdornment';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import FormTextField from '../../components/forms/FormTextField';
import { registerSchema } from '../../utils/validationSchemas';
import { useRegisterMutation } from '../../redux/api/authApi';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [register, { isLoading }] = useRegisterMutation();

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...payload } = data;
      await register(payload).unwrap();
      enqueueSnackbar('Registration successful! Verify your email.', { variant: 'success' });
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (error) {
      enqueueSnackbar(error?.data?.message || 'Registration failed', { variant: 'error' });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <FormTextField
            name="firstName"
            control={control}
            label="First Name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormTextField name="lastName" control={control} label="Last Name" />
        </Stack>
        <FormTextField
          name="email"
          control={control}
          label="Email Address"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormTextField
          name="phone"
          control={control}
          label="Phone (optional)"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormTextField
          name="password"
          control={control}
          label="Password"
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

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>

        <Stack direction="row" justifyContent="center" spacing={0.5} mt={3}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?
          </Typography>
          <Link component={RouterLink} to="/login" variant="body2">
            Sign in
          </Link>
        </Stack>
      </Box>
  );
};

export default RegisterPage;
