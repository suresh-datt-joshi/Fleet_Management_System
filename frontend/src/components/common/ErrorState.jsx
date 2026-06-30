import { Box, Typography, Button, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

const ErrorState = ({ message = 'Something went wrong', onRetry }) => (
  <Box sx={{ py: 4 }}>
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      <Typography variant="body2">{message}</Typography>
    </Alert>
  </Box>
);

export default ErrorState;
