import { useState } from 'react';
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { TRIP_STATUS } from '../../constants';
import {
  useGetMyActiveTripQuery,
  useGetMyScheduledTripsQuery,
  useGetMyDriverProfileQuery,
  useGetTripsQuery,
  useGetTripQuery,
  useStartTripMutation,
} from '../../redux/api/tripsApi';
import ActiveTripPanel from '../../features/live-trips/components/ActiveTripPanel';
import CompletedTripDetailDrawer from '../../features/live-trips/components/CompletedTripDetailDrawer';
import {
  formatCurrency,
  formatLocation,
  statusLabels,
} from '../../features/trips/utils/tripUtils';
import ErrorState from '../../components/common/ErrorState';

const TAB = { LIVE: 0, SUBMITTED: 1 };

const LiveTripUpdatesPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(TAB.LIVE);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: driverData } = useGetMyDriverProfileQuery();
  const { data: activeData, isLoading: activeLoading, refetch: refetchActive } = useGetMyActiveTripQuery(undefined, {
    pollingInterval: tab === TAB.LIVE ? 30000 : 0,
  });
  const { data: scheduledData } = useGetMyScheduledTripsQuery(undefined, {
    pollingInterval: tab === TAB.LIVE ? 15000 : 0,
  });
  const { data: submittedData, isLoading: submittedLoading } = useGetTripsQuery({
    page: 1,
    limit: 50,
    statuses: `${TRIP_STATUS.PENDING_DISPATCHER_REVIEW},${TRIP_STATUS.REVIEWED},${TRIP_STATUS.COMPLETED}`,
    sort: 'submittedAt:desc',
  });
  const { data: selectedTripData } = useGetTripQuery(selectedTripId, { skip: !selectedTripId });

  const [startTrip, { isLoading: starting }] = useStartTripMutation();

  const driver = driverData?.data?.driver;
  const activeTrip = activeData?.data?.trip;
  const scheduledTrips = scheduledData?.data || [];
  const submittedTrips = submittedData?.data?.trips || [];

  const handleStartTrip = async (id) => {
    try {
      await startTrip(id).unwrap();
      enqueueSnackbar('Trip started — you can now log live updates', { variant: 'success' });
      refetchActive();
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Failed to start trip', { variant: 'error' });
    }
  };

  const handleTripCompleted = () => {
    refetchActive();
    setTab(TAB.SUBMITTED);
  };

  const openCompletedDetail = (trip) => {
    setSelectedTripId(trip.id);
    setDetailOpen(true);
  };

  if (!driver && !activeLoading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} mb={2}>
          Live Trip Updates
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
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Live Trip Updates
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Log fuel, food, bills, and consignment status while on trip
          {driver?.name ? ` · ${driver.name}` : ''}
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab
          icon={<LocalShippingIcon />}
          iconPosition="start"
          label={activeTrip ? 'Active Trip' : 'Live Updates'}
        />
        <Tab icon={<CheckCircleIcon />} iconPosition="start" label={`Submitted (${submittedTrips.length})`} />
      </Tabs>

      {tab === TAB.LIVE && (
        <>
          {activeLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <ActiveTripPanel
              trip={activeTrip}
              scheduledTrips={scheduledTrips}
              onStartTrip={handleStartTrip}
              startingTrip={starting}
              onTripCompleted={handleTripCompleted}
            />
          )}
        </>
      )}

      {tab === TAB.SUBMITTED && (
        <>
          {submittedLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : submittedTrips.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary">No submitted trips yet</Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {submittedTrips.map((trip) => (
                <Grid item xs={12} sm={6} md={4} key={trip.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardActionArea onClick={() => openCompletedDetail(trip)} sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {trip.tripNumber}
                          </Typography>
                          <Chip
                            label={statusLabels[trip.status] || trip.status}
                            size="small"
                            color={
                              trip.status === TRIP_STATUS.PENDING_DISPATCHER_REVIEW ? 'secondary' : 'success'
                            }
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {formatLocation(trip.origin)} → {formatLocation(trip.destination)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {trip.submittedAt
                            ? format(new Date(trip.submittedAt), 'MMM d, yyyy HH:mm')
                            : trip.completedAt
                              ? format(new Date(trip.completedAt), 'MMM d, yyyy HH:mm')
                              : '—'}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" mt={2}>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(trip.expenses)}
                          </Typography>
                          {trip.status === TRIP_STATUS.PENDING_DISPATCHER_REVIEW && (
                            <Typography variant="caption" color="text.secondary">
                              Awaiting dispatcher review
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

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

export default LiveTripUpdatesPage;
