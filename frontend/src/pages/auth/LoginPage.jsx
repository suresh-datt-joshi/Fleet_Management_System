import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Alert, Box, Button, InputAdornment, Link, Stack, Typography } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import FormTextField from '../../components/forms/FormTextField';
import { loginSchema } from '../../utils/validationSchemas';
import { useLoginMutation } from '../../redux/api/authApi';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    try {
      await login(data).unwrap();
      enqueueSnackbar('Welcome back!', { variant: 'success' });
      navigate(from, { replace: true });
    } catch (error) {
      const message = error?.data?.message || 'Login failed';
      if (message.includes('verify your email')) {
        navigate('/verify-otp', { state: { email: data.email } });
      }
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormTextField
          name="email"
          control={control}
          label="Email Address"
          autoComplete="email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <FormTextField
          name="password"
          control={control}
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

        <Box sx={{ textAlign: 'right', mt: 1 }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2">
            Forgot password?
          </Link>
        </Box>

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>

        <Stack direction="row" justifyContent="center" spacing={0.5} mt={3}>
          <Typography variant="body2" color="text.secondary">
            Don&apos;t have an account?
          </Typography>
          <Link component={RouterLink} to="/register" variant="body2">
            Create account
          </Link>
        </Stack>
      </Box>
  );
};

export default LoginPage;
