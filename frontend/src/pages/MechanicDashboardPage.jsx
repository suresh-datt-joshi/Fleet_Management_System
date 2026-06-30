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
import BuildIcon from '@mui/icons-material/Build';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TodayIcon from '@mui/icons-material/Today';
import EventIcon from '@mui/icons-material/Event';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isAfter, startOfDay, subDays } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS, ROLE_LABELS } from '../constants';
import {
  useGetMyAssignedMaintenanceQuery,
  useStartMaintenanceMutation,
  useCompleteMaintenanceMutation,
  useUpdateMaintenanceMutation,
} from '../redux/api/maintenanceApi';
import StatCard from '../features/dashboard/components/StatCard';
import MechanicJobCard from '../features/dashboard/mechanic/MechanicJobCard';
import UpdateProgressDialog from '../features/dashboard/mechanic/UpdateProgressDialog';
import MaintenanceDetailDrawer from '../features/maintenance/components/MaintenanceDetailDrawer';
import MaintenanceReportDialog from '../features/maintenance/components/MaintenanceReportDialog';
import { StatCardSkeleton } from '../components/common/DashboardSkeletons';
import ErrorState from '../components/common/ErrorState';
import { MAINTENANCE_STATUS } from '../features/maintenance/utils/maintenanceUtils';

const JobSection = ({ title, icon, jobs, emptyMessage, accentColor, children, action }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box sx={{ color: accentColor || 'primary.main', display: 'flex' }}>{icon}</Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Chip label={jobs.length} size="small" />
        </Box>
        {action}
      </Box>
      {jobs.length === 0 ? (
        <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
          {emptyMessage}
        </Typography>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

const MechanicDashboardPage = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const canManage = hasPermission(PERMISSIONS.MANAGE_MAINTENANCE);

  const [detailRecord, setDetailRecord] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [progressRecord, setProgressRecord] = useState(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [reportRecord, setReportRecord] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } = useGetMyAssignedMaintenanceQuery({
    limit: 100,
    sort: 'scheduledDate:asc',
  });

  const [startMaintenance, { isLoading: starting }] = useStartMaintenanceMutation();
  const [completeMaintenance, { isLoading: completing }] = useCompleteMaintenanceMutation();
  const [updateMaintenance, { isLoading: updating }] = useUpdateMaintenanceMutation();

  const jobs = data?.data?.records || [];

  const grouped = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekAgo = subDays(now, 7);

    const pending = jobs.filter((j) =>
      [MAINTENANCE_STATUS.SCHEDULED, MAINTENANCE_STATUS.OVERDUE].includes(j.status)
    );
    const inProgress = jobs.filter((j) => j.status === MAINTENANCE_STATUS.IN_PROGRESS);
    const overdue = jobs.filter((j) => j.status === MAINTENANCE_STATUS.OVERDUE);
    const todaySchedule = jobs.filter(
      (j) =>
        j.scheduledDate &&
        isToday(new Date(j.scheduledDate)) &&
        j.status !== MAINTENANCE_STATUS.COMPLETED
    );
    const upcoming = jobs.filter(
      (j) =>
        j.scheduledDate &&
        isAfter(new Date(j.scheduledDate), todayStart) &&
        !isToday(new Date(j.scheduledDate)) &&
        [MAINTENANCE_STATUS.SCHEDULED].includes(j.status)
    );
    const recentlyCompleted = jobs
      .filter((j) => j.status === MAINTENANCE_STATUS.COMPLETED)
      .sort((a, b) => new Date(b.completedDate || b.updatedAt) - new Date(a.completedDate || a.updatedAt))
      .slice(0, 5);

    const completedThisWeek = jobs.filter(
      (j) =>
        j.status === MAINTENANCE_STATUS.COMPLETED &&
        j.completedDate &&
        new Date(j.completedDate) >= weekAgo
    );

    const activeJobs = [...inProgress, ...todaySchedule.filter((j) => j.status !== MAINTENANCE_STATUS.IN_PROGRESS)];

    return {
      pending,
      inProgress,
      overdue,
      todaySchedule,
      upcoming,
      recentlyCompleted,
      completedThisWeek,
      activeJobs,
    };
  }, [jobs]);

  const handleStart = useCallback(
    async (id) => {
      try {
        const result = await startMaintenance(id).unwrap();
        enqueueSnackbar('Job started', { variant: 'success' });
        if (detailRecord?.id === id) setDetailRecord(result.data.record);
      } catch (err) {
        enqueueSnackbar(err?.data?.message || 'Failed to start job', { variant: 'error' });
      }
    },
    [startMaintenance, enqueueSnackbar, detailRecord]
  );

  const handleOpenProgress = (record) => {
    setProgressRecord(record);
    setProgressOpen(true);
  };

  const handleProgressSubmit = async (payload) => {
    if (!progressRecord) return;
    try {
      const result = await updateMaintenance({ id: progressRecord.id, ...payload }).unwrap();
      enqueueSnackbar('Progress saved', { variant: 'success' });
      if (detailRecord?.id === progressRecord.id) setDetailRecord(result.data.record);
      setProgressOpen(false);
      setProgressRecord(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Failed to save progress', { variant: 'error' });
    }
  };

  const handleOpenReport = (record) => {
    setReportRecord(record);
    setReportOpen(true);
  };

  const handleReportSubmit = async (payload) => {
    if (!reportRecord) return;
    try {
      const result = await completeMaintenance({ id: reportRecord.id, ...payload }).unwrap();
      enqueueSnackbar('Job completed successfully', { variant: 'success' });
      setDetailRecord(result.data.record);
      setReportOpen(false);
      setReportRecord(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Failed to complete job', { variant: 'error' });
    }
  };

  const handleViewHistory = (record) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const jobCardProps = {
    user,
    canManage,
    onStart: handleStart,
    onUpdateProgress: handleOpenProgress,
    onComplete: handleOpenReport,
    onViewHistory: handleViewHistory,
    starting,
  };

  if (isError) {
    return (
      <ErrorState
        message={error?.data?.message || 'Failed to load your assigned jobs'}
        onRetry={refetch}
      />
    );
  }

  const inProgressJob = grouped.inProgress[0];

  return (
    <Box>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your work queue for {format(new Date(), 'EEEE, MMMM d')}
          </Typography>
          <Box display="flex" gap={1} mt={1} flexWrap="wrap">
            <Chip label={ROLE_LABELS[user?.role] || user?.role} color="primary" size="small" />
            {grouped.inProgress.length > 0 && (
              <Chip
                icon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
                label={`${grouped.inProgress.length} active`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
            {grouped.overdue.length > 0 && (
              <Chip
                icon={<WarningIcon sx={{ fontSize: 16 }} />}
                label={`${grouped.overdue.length} overdue`}
                size="small"
                color="error"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/maintenance')}
          >
            All Assignments
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={refetch} disabled={isFetching}>
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
                title: 'Pending',
                value: grouped.pending.length,
                subtitle: 'Awaiting start',
                icon: <PendingActionsIcon />,
                color: '#1565C0',
              },
              {
                title: 'In Progress',
                value: grouped.inProgress.length,
                subtitle: 'Active jobs',
                icon: <BuildIcon />,
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
                title: 'Overdue',
                value: grouped.overdue.length,
                subtitle: 'Needs attention',
                icon: <WarningIcon />,
                color: '#D32F2F',
              },
            ].map((card, index) => (
              <Grid item xs={6} sm={3} key={card.title}>
                <StatCard {...card} index={index} />
              </Grid>
            ))}
      </Grid>

      {inProgressJob && (
        <Card sx={{ mb: 3, border: 2, borderColor: 'warning.main' }}>
          <CardContent>
            <Typography variant="overline" color="warning.main" fontWeight={700}>
              Current Job
            </Typography>
            <MechanicJobCard job={inProgressJob} {...jobCardProps} />
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={8}>
          <JobSection
            title="Today's Schedule"
            icon={<TodayIcon />}
            jobs={grouped.todaySchedule}
            emptyMessage="No jobs scheduled for today"
            accentColor="#1565C0"
          >
            <Stack spacing={1.5}>
              {grouped.todaySchedule.map((job) => (
                <MechanicJobCard key={job.id} job={job} {...jobCardProps} />
              ))}
            </Stack>
          </JobSection>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            <JobSection
              title="Overdue"
              icon={<WarningIcon />}
              jobs={grouped.overdue}
              emptyMessage="No overdue jobs"
              accentColor="#D32F2F"
            >
              <Stack spacing={1.5}>
                {grouped.overdue.map((job) => (
                  <MechanicJobCard key={job.id} job={job} {...jobCardProps} compact />
                ))}
              </Stack>
            </JobSection>

            <JobSection
              title="Upcoming"
              icon={<EventIcon />}
              jobs={grouped.upcoming.slice(0, 5)}
              emptyMessage="No upcoming jobs"
              accentColor="#7B1FA2"
              action={
                grouped.upcoming.length > 5 ? (
                  <Button size="small" onClick={() => navigate('/maintenance')}>
                    View all
                  </Button>
                ) : null
              }
            >
              <Stack spacing={1.5}>
                {grouped.upcoming.slice(0, 5).map((job) => (
                  <MechanicJobCard key={job.id} job={job} {...jobCardProps} compact />
                ))}
              </Stack>
            </JobSection>
          </Stack>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <JobSection
            title="Assigned Tasks"
            icon={<BuildIcon />}
            jobs={grouped.pending.filter((j) => !grouped.todaySchedule.some((t) => t.id === j.id))}
            emptyMessage="All pending jobs are scheduled for today"
            accentColor="#00897B"
          >
            <Stack spacing={1.5}>
              {grouped.pending
                .filter((j) => !grouped.todaySchedule.some((t) => t.id === j.id))
                .slice(0, 5)
                .map((job) => (
                  <MechanicJobCard key={job.id} job={job} {...jobCardProps} />
                ))}
            </Stack>
          </JobSection>
        </Grid>

        <Grid item xs={12} md={6}>
          <JobSection
            title="Recently Completed"
            icon={<CheckCircleIcon />}
            jobs={grouped.recentlyCompleted}
            emptyMessage="No completed jobs yet"
            accentColor="#2E7D32"
          >
            <Stack spacing={1.5}>
              {grouped.recentlyCompleted.map((job) => (
                <MechanicJobCard key={job.id} job={job} {...jobCardProps} compact readOnly />
              ))}
            </Stack>
          </JobSection>
        </Grid>
      </Grid>

      <MaintenanceDetailDrawer
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailRecord(null);
        }}
        record={detailRecord}
        onEdit={() => {}}
        onAssign={() => {}}
        onStart={handleStart}
        onComplete={handleOpenReport}
        canManage={canManage}
        canAssign={false}
        loadingAction={starting}
        user={user}
      />

      <UpdateProgressDialog
        open={progressOpen}
        onClose={() => {
          setProgressOpen(false);
          setProgressRecord(null);
        }}
        onSubmit={handleProgressSubmit}
        record={progressRecord}
        isLoading={updating}
      />

      <MaintenanceReportDialog
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportRecord(null);
        }}
        onSubmit={handleReportSubmit}
        record={reportRecord}
        isLoading={completing}
      />
    </Box>
  );
};

export default MechanicDashboardPage;
