import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonIcon from '@mui/icons-material/Person';
import RouteIcon from '@mui/icons-material/Route';
import BuildIcon from '@mui/icons-material/Build';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import WarningIcon from '@mui/icons-material/Warning';
import EmptyState from '../../../components/common/EmptyState';
import { formatRelativeTime } from '../../../utils/formatters';

const activityIcons = {
  trip_created: <RouteIcon />,
  trip_completed: <RouteIcon />,
  vehicle_added: <LocalShippingIcon />,
  driver_assigned: <PersonIcon />,
  maintenance_scheduled: <BuildIcon />,
  fuel_logged: <LocalGasStationIcon />,
  alert_triggered: <WarningIcon />,
};

const activityColors = {
  trip_created: '#1565C0',
  trip_completed: '#00897B',
  vehicle_added: '#1565C0',
  driver_assigned: '#7B1FA2',
  maintenance_scheduled: '#ED6C02',
  fuel_logged: '#0288D1',
  alert_triggered: '#D32F2F',
};

const RecentActivities = ({ activities = [] }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ pb: 1 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Recent Activities
      </Typography>
      {activities.length === 0 ? (
        <EmptyState title="No recent activity" description="Fleet activities will appear here" />
      ) : (
        <List disablePadding>
          {activities.map((activity) => (
            <ListItem key={activity.id} alignItems="flex-start" sx={{ px: 0 }}>
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: `${activityColors[activity.type] || '#1565C0'}15`,
                    color: activityColors[activity.type] || '#1565C0',
                    width: 40,
                    height: 40,
                  }}
                >
                  {activityIcons[activity.type] || <RouteIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={600}>
                    {activity.title}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {activity.description}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatRelativeTime(activity.createdAt)}
                      {activity.user?.name && ` · ${activity.user.name}`}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </CardContent>
  </Card>
);

export default RecentActivities;
