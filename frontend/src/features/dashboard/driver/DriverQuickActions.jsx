import { Card, CardContent, Typography, Grid, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UpdateIcon from '@mui/icons-material/Update';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

const DriverQuickActions = ({
  hasActiveTrip,
  hasScheduledTrip,
  onStartTrip,
  onUpdateStatus,
  onCompleteTrip,
  onViewHistory,
  onReportIssue,
  starting,
}) => {
  const actions = [
    {
      label: 'Start Trip',
      icon: <PlayArrowIcon />,
      color: '#1565C0',
      onClick: onStartTrip,
      disabled: !hasScheduledTrip || hasActiveTrip || starting,
    },
    {
      label: 'Update Trip Status',
      icon: <UpdateIcon />,
      color: '#ED6C02',
      onClick: onUpdateStatus,
      disabled: !hasActiveTrip,
    },
    {
      label: 'Complete Trip',
      icon: <CheckCircleIcon />,
      color: '#2E7D32',
      onClick: onCompleteTrip,
      disabled: !hasActiveTrip,
    },
    {
      label: 'View Trip History',
      icon: <HistoryIcon />,
      color: '#7B1FA2',
      onClick: onViewHistory,
      disabled: false,
    },
    {
      label: 'Report an Issue',
      icon: <ReportProblemIcon />,
      color: '#D32F2F',
      onClick: onReportIssue,
      disabled: false,
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Quick Actions
        </Typography>
        <Grid container spacing={1.5}>
          {actions.map((action) => (
            <Grid item xs={6} sm={4} md key={action.label}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled}
                sx={{
                  py: 1.25,
                  justifyContent: 'flex-start',
                  borderColor: action.color,
                  color: action.disabled ? undefined : action.color,
                  '&:hover': {
                    borderColor: action.color,
                    bgcolor: `${action.color}10`,
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

export default DriverQuickActions;
