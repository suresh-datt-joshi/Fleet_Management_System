import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

const EmptyState = ({ title = 'No data yet', description = '', actionLabel, onAction, icon }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 6,
      px: 2,
      textAlign: 'center',
    }}
  >
    <Box sx={{ color: 'text.disabled', mb: 2 }}>{icon || <InboxIcon sx={{ fontSize: 48 }} />}</Box>
    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" mb={2}>
        {description}
      </Typography>
    )}
    {actionLabel && onAction && (
      <Button variant="outlined" size="small" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState;
