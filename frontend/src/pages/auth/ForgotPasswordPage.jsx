import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, InputAdornment, Link, Stack, Typography } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import FormTextField from '../../components/forms/FormTextField';
import { forgotPasswordSchema } from '../../utils/validationSchemas';
import { useForgotPasswordMutation } from '../../redux/api/authApi';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [forgotPassword, { isLoading, isSuccess }] = useForgotPasswordMutation();

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    try {
      await forgotPassword(data).unwrap();
      enqueueSnackbar('If the email exists, an OTP has been sent', { variant: 'success' });
      navigate('/reset-password', { state: { email: data.email } });
    } catch (error) {
      enqueueSnackbar(error?.data?.message || 'Request failed', { variant: 'error' });
    }
  };

  return (
    <>
      {isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Check your email for the password reset OTP.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Code'}
        </Button>

        <Stack direction="row" justifyContent="center" mt={3}>
          <Link component={RouterLink} to="/login" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ArrowBackIcon fontSize="small" /> Back to login
          </Link>
        </Stack>
      </Box>
    </>
  );
};

export default ForgotPasswordPage;
