import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Box,
  Badge,
} from '@mui/material';
import EmptyState from '../../../components/common/EmptyState';
import { formatRelativeTime } from '../../../utils/formatters';

const severityColors = {
  low: 'default',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const AlertsPanel = ({ alerts = [] }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ pb: 1 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6" fontWeight={600}>
          Alerts
        </Typography>
        <Badge badgeContent={alerts.filter((a) => !a.isRead).length} color="error">
          <Chip label="Live" size="small" color="error" variant="outlined" />
        </Badge>
      </Box>
      {alerts.length === 0 ? (
        <EmptyState title="No alerts" description="All systems operating normally" />
      ) : (
        <List disablePadding>
          {alerts.map((alert) => (
            <ListItem
              key={alert.id}
              sx={{
                px: 0,
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                opacity: alert.isRead ? 0.7 : 1,
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <Box display="flex" alignItems="center" gap={1} width="100%" mb={0.5}>
                <Typography variant="body2" fontWeight={600} flex={1}>
                  {alert.title}
                </Typography>
                <Chip
                  label={alert.severity}
                  size="small"
                  color={severityColors[alert.severity] || 'default'}
                  sx={{ textTransform: 'capitalize', height: 22 }}
                />
              </Box>
              <ListItemText
                primary={null}
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatRelativeTime(alert.createdAt)}
                      {alert.vehicle?.number && ` · ${alert.vehicle.number}`}
                    </Typography>
                  </Box>
                }
                sx={{ m: 0 }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </CardContent>
  </Card>
);

export default AlertsPanel;
