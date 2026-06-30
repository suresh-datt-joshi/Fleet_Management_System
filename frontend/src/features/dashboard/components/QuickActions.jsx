import { Card, CardContent, Typography, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import RouteIcon from '@mui/icons-material/Route';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../constants';

const actions = [
  {
    label: 'Add Vehicle',
    icon: <LocalShippingIcon />,
    permission: PERMISSIONS.CREATE_VEHICLES,
    color: '#1565C0',
    path: '/vehicles',
  },
  {
    label: 'Add Driver',
    icon: <PeopleIcon />,
    permission: PERMISSIONS.CREATE_DRIVERS,
    color: '#00897B',
    path: '/drivers',
  },
  {
    label: 'Live Tracking',
    icon: <GpsFixedIcon />,
    permission: PERMISSIONS.VIEW_TRACKING,
    color: '#1565C0',
    path: '/tracking',
  },
  {
    label: 'Schedule Maintenance',
    icon: <BuildIcon />,
    permission: PERMISSIONS.MANAGE_MAINTENANCE,
    color: '#7B1FA2',
    path: '/maintenance',
  },
  {
    label: 'Upload Document',
    icon: <DescriptionIcon />,
    permission: PERMISSIONS.MANAGE_DOCUMENTS,
    color: '#1565C0',
    path: '/documents',
  },
  {
    label: 'View Alerts',
    icon: <NotificationsActiveIcon />,
    permission: PERMISSIONS.VIEW_ALERTS,
    color: '#D32F2F',
    path: '/alerts',
  },
  {
    label: 'Log Fuel',
    icon: <LocalGasStationIcon />,
    permission: PERMISSIONS.MANAGE_FUEL,
    color: '#00897B',
    path: '/fuel',
  },
  {
    label: 'Manage Routes',
    icon: <RouteIcon />,
    permission: PERMISSIONS.MANAGE_ROUTES,
    color: '#ED6C02',
    path: '/routes',
  },
  {
    label: 'Create Trip',
    icon: <RouteIcon />,
    permission: PERMISSIONS.CREATE_TRIPS,
    color: '#ED6C02',
    path: '/trips',
  },
  {
    label: 'View Reports',
    icon: <AssessmentIcon />,
    permission: PERMISSIONS.VIEW_REPORTS,
    color: '#7B1FA2',
    path: '/reports',
  },
];

const QuickActions = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const visibleActions = actions.filter((a) => hasPermission(a.permission));

  if (visibleActions.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={1.5}>
          {visibleActions.map((action) => (
            <Grid item xs={6} sm={3} key={action.label}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={action.icon}
                disabled={!action.path}
                onClick={() => action.path && navigate(action.path)}
                sx={{
                  py: 1.5,
                  borderColor: `${action.color}40`,
                  color: action.color,
                  '&:hover': {
                    borderColor: action.color,
                    bgcolor: `${action.color}08`,
                  },
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
