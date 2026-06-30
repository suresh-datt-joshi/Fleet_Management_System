import { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import RouteIcon from '@mui/icons-material/Route';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TodayIcon from '@mui/icons-material/Today';
import EventIcon from '@mui/icons-material/Event';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS, TRIP_STATUS } from '../constants';
import {
  useGetMyDriverProfileQuery,
  useGetMyActiveTripQuery,
  useGetTripsQuery,
  useStartTripMutation,
  useUpdateTripMutation,
  useGetTripQuery,
} from '../redux/api/tripsApi';
import { useGetDashboardAlertsQuery } from '../redux/api/dashboardApi';
import StatCard from '../features/dashboard/components/StatCard';
import AlertsPanel from '../features/dashboard/components/AlertsPanel';
import DriverTripCard from '../features/dashboard/driver/DriverTripCard';
import AssignedVehicleCard from '../features/dashboard/driver/AssignedVehicleCard';
import DriverQuickActions from '../features/dashboard/driver/DriverQuickActions';
import ReportIssueDialog from '../features/dashboard/driver/ReportIssueDialog';
import CompletedTripDetailDrawer from '../features/live-trips/components/CompletedTripDetailDrawer';
import { buildComplianceAlerts, groupDriverTrips } from '../features/dashboard/driver/driverDashboardUtils';
import { StatCardSkeleton } from '../components/common/DashboardSkeletons';
import ErrorState from '../components/common/ErrorState';

const TripSection = ({ title, icon, trips, emptyMessage, accentColor, children, action }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ color: accentColor || 'primary.main', display: 'flex' }}>{icon}</Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Chip label={trips.length} size="small" />
        </Box>
        {action}
      </Box>
      {trips.length === 0 ? (
        <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
          {emptyMessage}
        </Typography>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

const DriverDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [reportOpen, setReportOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: driverData, isLoading: driverLoading, refetch: refetchDriver } = useGetMyDriverProfileQuery();
  const {
    data: activeData,
    isLoading: activeLoading,
    refetch: refetchActive,
    isFetching: activeFetching,
  } = useGetMyActiveTripQuery(undefined, { pollingInterval: 30000 });
  const {
    data: tripsData,
    isLoading: tripsLoading,
    refetch: refetchTrips,
    isFetching: tripsFetching,
  } = useGetTripsQuery({ page: 1, limit: 50, sort: 'scheduledAt:asc' });
  const { data: alertsData, refetch: refetchAlerts } = useGetDashboardAlertsQuery(8);
  const { data: selectedTripData } = useGetTripQuery(selectedTripId, { skip: !selectedTripId });

  const [startTrip, { isLoading: starting }] = useStartTripMutation();
  const [updateTrip, { isLoading: reporting }] = useUpdateTripMutation();

  const driver = driverData?.data?.driver;
  const activeTrip = activeData?.data?.trip;
  const allTrips = tripsData?.data?.trips || [];
  const systemAlerts = alertsData?.data || [];

  const grouped = useMemo(
    () => groupDriverTrips(allTrips, activeTrip),
    [allTrips, activeTrip]
  );

  const complianceAlerts = useMemo(() => buildComplianceAlerts(driver), [driver]);
  const alerts = useMemo(() => {
    const combined = [...complianceAlerts, ...systemAlerts];
    const seen = new Set();
    return combined.filter((alert) => {
      const key = alert.id || `${alert.title}-${alert.createdAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
  }, [complianceAlerts, systemAlerts]);

  const isLoading = driverLoading || activeLoading || tripsLoading;
  const isFetching = activeFetching || tripsFetching;

  const refetchAll = useCallback(() => {
    refetchDriver();
    refetchActive();
    refetchTrips();
    refetchAlerts();
  }, [refetchDriver, refetchActive, refetchTrips, refetchAlerts]);

  const handleStart = useCallback(
    async (id) => {
      try {
        await startTrip(id).unwrap();
        enqueueSnackbar('Trip started — head to Live Trip Updates to log progress', { variant: 'success' });
        refetchAll();
      } catch (err) {
        enqueueSnackbar(err?.data?.message || 'Failed to start trip', { variant: 'error' });
      }
    },
    [startTrip, enqueueSnackbar, refetchAll]
  );

  const handleUpdateStatus = () => navigate('/live-trips');
  const handleCompleteTrip = () => navigate('/live-trips');
  const handleViewHistory = (trip) => {
    setSelectedTripId(trip.id);
    setDetailOpen(true);
  };

  const handleQuickStart = () => {
    const nextTrip = grouped.todaySchedule[0] || grouped.assigned[0];
    if (nextTrip) handleStart(nextTrip.id);
    else navigate('/live-trips');
  };

  const handleReportIssue = async ({ category, description }) => {
    const timestamp = format(new Date(), 'MMM d, yyyy HH:mm');
    const issueNote = `[Issue Report · ${category} · ${timestamp}] ${description}`;

    if (activeTrip) {
      try {
        const existingNotes = activeTrip.notes?.trim();
        await updateTrip({
          id: activeTrip.id,
          notes: existingNotes ? `${existingNotes}\n\n${issueNote}` : issueNote,
        }).unwrap();
        enqueueSnackbar('Issue reported and logged to your active trip', { variant: 'success' });
        setReportOpen(false);
        refetchAll();
        return;
      } catch (err) {
        enqueueSnackbar(err?.data?.message || 'Failed to submit report', { variant: 'error' });
        return;
      }
    }

    enqueueSnackbar('Issue noted — contact your dispatcher via Alerts for urgent matters', { variant: 'info' });
    setReportOpen(false);
    navigate('/alerts');
  };

  const tripCardProps = {
    onStart: handleStart,
    onUpdateStatus: handleUpdateStatus,
    onComplete: handleCompleteTrip,
    onViewHistory: handleViewHistory,
    starting,
  };

  const inProgressTrip = activeTrip || grouped.active[0];

  if (!driver && !isLoading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} mb={2}>
          Driver Dashboard
        </Typography>
        <ErrorState
          title="No driver profile linked"
          message="Your login is not linked to a driver record. Ensure the driver profile under Drivers uses the same email as your login account, or ask your fleet manager to link them."
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your trips for {format(new Date(), 'EEEE, MMMM d')}
          </Typography>
          <Box display="flex" gap={1} mt={1} flexWrap="wrap">
            <Chip label={ROLE_LABELS[user?.role] || user?.role} color="primary" size="small" />
            {grouped.inProgressCount > 0 && (
              <Chip
                icon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
                label="Trip in progress"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
            {complianceAlerts.some((a) => a.severity === 'critical' || a.severity === 'high') && (
              <Chip
                icon={<WarningIcon sx={{ fontSize: 16 }} />}
                label="Action required"
                size="small"
                color="error"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/live-trips')}>
            Live Trip Updates
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={refetchAll} disabled={isFetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <StatCardSkeleton />
              </Grid>
            ))
          : [
              {
                title: 'Assigned',
                value: grouped.assignedCount,
                subtitle: 'Awaiting start',
                icon: <PendingActionsIcon />,
                color: '#1565C0',
              },
              {
                title: 'In Progress',
                value: grouped.inProgressCount,
                subtitle: 'Active now',
                icon: <RouteIcon />,
                color: '#ED6C02',
              },
              {
                title: 'Completed',
                value: grouped.completedThisWeek.length,
                subtitle: 'This week',
                icon: <CheckCircleIcon />,
                color: '#2E7D32',
              },
              {
                title: 'Today',
                value: grouped.todaySchedule.length,
                subtitle: 'Scheduled today',
                icon: <TodayIcon />,
                color: '#0288D1',
              },
            ].map((card, index) => (
              <Grid item xs={6} sm={3} key={card.title}>
                <StatCard {...card} index={index} />
              </Grid>
            ))}
      </Grid>

      <Box mb={3}>
        <DriverQuickActions
          hasActiveTrip={!!inProgressTrip}
          hasScheduledTrip={grouped.assigned.length > 0}
          onStartTrip={handleQuickStart}
          onUpdateStatus={handleUpdateStatus}
          onCompleteTrip={handleCompleteTrip}
          onViewHistory={() => {
            const recent = grouped.recentlyCompleted[0];
            if (recent) handleViewHistory(recent);
            else navigate('/trips');
          }}
          onReportIssue={() => setReportOpen(true)}
          starting={starting}
        />
      </Box>

      {inProgressTrip && (
        <Card sx={{ mb: 3, border: 2, borderColor: 'warning.main' }}>
          <CardContent>
            <Typography variant="overline" color="warning.main" fontWeight={700}>
              Current Trip
            </Typography>
            <DriverTripCard trip={inProgressTrip} {...tripCardProps} />
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={8}>
          <TripSection
            title="Today's Schedule"
            icon={<TodayIcon />}
            trips={grouped.todaySchedule}
            emptyMessage="No trips scheduled for today"
            accentColor="#1565C0"
          >
            <Stack spacing={1.5}>
              {grouped.todaySchedule.map((trip) => (
                <DriverTripCard key={trip.id} trip={trip} {...tripCardProps} />
              ))}
            </Stack>
          </TripSection>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <AssignedVehicleCard vehicle={driver?.assignedVehicle} />

            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningIcon color="error" />
                  <Typography variant="h6" fontWeight={600}>
                    Important Alerts
                  </Typography>
                  {alerts.length > 0 && <Chip label={alerts.length} size="small" color="error" variant="outlined" />}
                </Box>
                {alerts.length > 0 && (
                  <Button size="small" onClick={() => navigate('/alerts')}>
                    View all
                  </Button>
                )}
              </Box>
              <AlertsPanel alerts={alerts} />
            </Box>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <TripSection
            title="Assigned Trips"
            icon={<PendingActionsIcon />}
            trips={grouped.assigned.filter((t) => !grouped.todaySchedule.some((s) => s.id === t.id))}
            emptyMessage="No other assigned trips"
            accentColor="#00897B"
          >
            <Stack spacing={1.5}>
              {grouped.assigned
                .filter((t) => !grouped.todaySchedule.some((s) => s.id === t.id))
                .slice(0, 5)
                .map((trip) => (
                  <DriverTripCard key={trip.id} trip={trip} {...tripCardProps} />
                ))}
            </Stack>
          </TripSection>
        </Grid>

        <Grid item xs={12} md={6}>
          <TripSection
            title="Upcoming Trips"
            icon={<EventIcon />}
            trips={grouped.upcoming.slice(0, 5)}
            emptyMessage="No upcoming trips scheduled"
            accentColor="#7B1FA2"
            action={
              grouped.upcoming.length > 5 ? (
                <Button size="small" onClick={() => navigate('/trips')}>
                  View all
                </Button>
              ) : null
            }
          >
            <Stack spacing={1.5}>
              {grouped.upcoming.slice(0, 5).map((trip) => (
                <DriverTripCard key={trip.id} trip={trip} {...tripCardProps} compact />
              ))}
            </Stack>
          </TripSection>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TripSection
            title="Recently Completed"
            icon={<CheckCircleIcon />}
            trips={grouped.recentlyCompleted}
            emptyMessage="No completed trips yet"
            accentColor="#2E7D32"
            action={
              grouped.recentlyCompleted.length > 0 ? (
                <Button size="small" onClick={() => navigate('/trips')}>
                  Full history
                </Button>
              ) : null
            }
          >
            <Grid container spacing={1.5}>
              {grouped.recentlyCompleted.map((trip) => (
                <Grid item xs={12} sm={6} md={4} key={trip.id}>
                  <DriverTripCard trip={trip} {...tripCardProps} compact readOnly />
                </Grid>
              ))}
            </Grid>
          </TripSection>
        </Grid>
      </Grid>

      <ReportIssueDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportIssue}
        isLoading={reporting}
        activeTrip={activeTrip}
      />

      <CompletedTripDetailDrawer
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedTripId(null);
        }}
        trip={selectedTripData?.data?.trip || null}
      />
    </Box>
  );
};

export default DriverDashboardPage;
