import { Box, Grid, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import RouteIcon from '@mui/icons-material/Route';
import BuildIcon from '@mui/icons-material/Build';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS, USER_ROLES } from '../constants';
import { usePermissions } from '../hooks/usePermissions';
import { useGetDashboardOverviewQuery } from '../redux/api/dashboardApi';
import { formatCurrency, formatNumber } from '../utils/formatters';
import StatCard from '../features/dashboard/components/StatCard';
import {
  TripsChart,
  FuelChart,
  FinancialChart,
  VehicleStatusChart,
} from '../features/dashboard/components/DashboardCharts';
import RecentActivities from '../features/dashboard/components/RecentActivities';
import AlertsPanel from '../features/dashboard/components/AlertsPanel';
import LiveVehiclesPanel from '../features/dashboard/components/LiveVehiclesPanel';
import QuickActions from '../features/dashboard/components/QuickActions';
import { StatCardSkeleton, ChartSkeleton } from '../components/common/DashboardSkeletons';
import ErrorState from '../components/common/ErrorState';
import MechanicDashboardPage from './MechanicDashboardPage';
import DriverDashboardPage from './DriverDashboardPage';

const FleetDashboardContent = () => {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch, isFetching } = useGetDashboardOverviewQuery();

  const summary = data?.data?.summary;
  const charts = data?.data?.charts;
  const activities = data?.data?.activities || [];
  const alerts = data?.data?.alerts || [];
  const liveVehicles = data?.data?.liveVehicles || [];

  if (isError) {
    return (
      <ErrorState
        message={error?.data?.message || 'Failed to load dashboard data'}
        onRetry={refetch}
      />
    );
  }

  const statCards = summary
    ? [
        {
          title: 'Total Vehicles',
          value: formatNumber(summary.vehicles.total),
          subtitle: `${summary.vehicles.active} active · ${summary.vehicles.live} live`,
          icon: <LocalShippingIcon />,
          color: '#1565C0',
        },
        {
          title: 'Active Drivers',
          value: formatNumber(summary.drivers.active),
          subtitle: `${summary.drivers.total} total drivers`,
          icon: <PeopleIcon />,
          color: '#00897B',
        },
        {
          title: 'Trips Today',
          value: formatNumber(summary.trips.today),
          subtitle: `${summary.trips.inProgress} in progress`,
          icon: <RouteIcon />,
          color: '#ED6C02',
        },
        {
          title: 'Maintenance Due',
          value: formatNumber(summary.maintenance.dueSoon),
          subtitle: `${summary.maintenance.overdue} overdue`,
          icon: <BuildIcon />,
          color: '#D32F2F',
        },
        {
          title: 'Fuel This Month',
          value: `${formatNumber(summary.fuel.quantityThisMonth)} L`,
          subtitle: formatCurrency(summary.fuel.costThisMonth),
          icon: <LocalGasStationIcon />,
          color: '#0288D1',
        },
        {
          title: 'Revenue',
          value: formatCurrency(summary.financials.revenueThisMonth),
          subtitle: `Profit: ${formatCurrency(summary.financials.profitThisMonth)}`,
          icon: <AttachMoneyIcon />,
          color: '#2E7D32',
        },
        {
          title: 'Expenses',
          value: formatCurrency(summary.financials.expensesThisMonth),
          subtitle: `${summary.trips.thisMonth} trips this month`,
          icon: <TrendingDownIcon />,
          color: '#C62828',
        },
        {
          title: 'Unread Alerts',
          value: formatNumber(summary.alerts.unread),
          subtitle: `${summary.alerts.critical} critical`,
          icon: <NotificationsActiveIcon />,
          color: '#7B1FA2',
        },
      ]
    : [];

  return (
    <Box>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome back, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Fleet operations overview and analytics
          </Typography>
          <Box display="flex" gap={1} mt={1} flexWrap="wrap">
            <Chip label={ROLE_LABELS[user?.role] || user?.role} color="primary" size="small" />
            <Chip
              icon={<GpsFixedIcon sx={{ fontSize: 16 }} />}
              label={`${summary?.vehicles?.live || 0} vehicles live`}
              size="small"
              variant="outlined"
              color="success"
            />
          </Box>
        </Box>
        <Tooltip title="Refresh dashboard">
          <IconButton onClick={refetch} disabled={isFetching}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3} mb={3}>
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <StatCardSkeleton />
              </Grid>
            ))
          : statCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={card.title}>
                <StatCard {...card} index={index} />
              </Grid>
            ))}
      </Grid>

      <Box mb={3}>
        <QuickActions />
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={8}>
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <TripsChart data={charts?.tripsTrend || []} />
          )}
        </Grid>
        <Grid item xs={12} lg={4}>
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <VehicleStatusChart data={charts?.vehicleStatusBreakdown || []} />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          {isLoading ? <ChartSkeleton /> : <FuelChart data={charts?.fuelTrend || []} />}
        </Grid>
        <Grid item xs={12} md={6}>
          {isLoading ? <ChartSkeleton /> : <FinancialChart data={charts?.financialTrend || []} />}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          {isLoading ? <ChartSkeleton /> : <RecentActivities activities={activities} />}
        </Grid>
        <Grid item xs={12} lg={4}>
          {isLoading ? <ChartSkeleton /> : <AlertsPanel alerts={alerts} />}
        </Grid>
        <Grid item xs={12} lg={4}>
          {isLoading ? <ChartSkeleton /> : <LiveVehiclesPanel vehicles={liveVehicles} />}
        </Grid>
      </Grid>
    </Box>
  );
};

const DashboardPage = () => {
  const { hasRole } = usePermissions();

  if (hasRole(USER_ROLES.MECHANIC)) {
    return <MechanicDashboardPage />;
  }

  if (hasRole(USER_ROLES.DRIVER)) {
    return <DriverDashboardPage />;
  }

  return <FleetDashboardContent />;
};

export default DashboardPage;
