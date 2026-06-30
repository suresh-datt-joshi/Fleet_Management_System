import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { otpSchema } from '../../utils/validationSchemas';
import { useAuthPageMeta } from '../../hooks/useAuthPageMeta';
import { useVerifyOtpMutation, useResendOtpMutation } from '../../redux/api/authApi';

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const email = location.state?.email || '';
  const [countdown, setCountdown] = useState(60);
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  useAuthPageMeta({
    subtitle: email ? `Enter the 6-digit code sent to ${email}` : undefined,
  });

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (data) => {
    try {
      await verifyOtp({ email, otp: data.otp }).unwrap();
      enqueueSnackbar('Email verified successfully!', { variant: 'success' });
      navigate('/dashboard');
    } catch (error) {
      enqueueSnackbar(error?.data?.message || 'Verification failed', { variant: 'error' });
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp({ email }).unwrap();
      setCountdown(60);
      enqueueSnackbar('OTP sent to your email', { variant: 'info' });
    } catch (error) {
      enqueueSnackbar(error?.data?.message || 'Failed to resend OTP', { variant: 'error' });
    }
  };

  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        Check your email inbox. In development mode, OTP is logged in the server console.
      </Alert>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Controller
          name="otp"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              fullWidth
              label="Verification Code"
              placeholder="000000"
              inputProps={{ maxLength: 6, style: { letterSpacing: 8, textAlign: 'center', fontSize: 24 } }}
              error={!!error}
              helperText={error?.message}
              margin="normal"
            />
          )}
        />

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </Button>

        <Stack alignItems="center" spacing={1} mt={3}>
          <Typography variant="body2" color="text.secondary">
            Didn&apos;t receive the code?
          </Typography>
          <Button
            variant="text"
            disabled={countdown > 0 || isResending}
            onClick={handleResend}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
          </Button>
          <Link component={RouterLink} to="/login" variant="body2">
            Back to login
          </Link>
        </Stack>
      </Box>
    </>
  );
};

export default OtpVerificationPage;
