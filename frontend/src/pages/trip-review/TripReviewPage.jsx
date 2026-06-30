import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { format } from 'date-fns';
import { useGetPendingReviewTripsQuery, useGetTripStatsQuery } from '../../redux/api/tripsApi';
import TripReviewDialog from '../../features/trips/components/TripReviewDialog';
import {
  statusColors,
  statusLabels,
  formatCurrency,
  formatLocation,
  formatDistance,
} from '../../features/trips/utils/tripUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';

const tripGridSx = {
  height: '100%',
  width: '100%',
  maxWidth: '100%',
  border: 'none',
  bgcolor: 'background.paper',
  '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
  '& .MuiDataGrid-columnHeaderTitle': { fontSize: '0.8125rem', fontWeight: 600 },
  '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', fontSize: '0.8125rem' },
};

const TruncatedCell = ({ value, title }) => {
  const text = value || '—';
  return (
    <Tooltip title={title || text} arrow placement="top-start">
      <Typography variant="body2" noWrap sx={{ width: '100%', fontSize: '0.8125rem', lineHeight: 1.4 }}>
        {text}
      </Typography>
    </Tooltip>
  );
};

const formatRouteLabel = (origin, destination) => {
  const from = formatLocation(origin);
  const to = formatLocation(destination);
  if (from === '—' && to === '—') return '—';
  return `${from} → ${to}`;
};

const TripReviewPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [reviewTripId, setReviewTripId] = useState(null);

  useEffect(() => {
    const tripParam = searchParams.get('trip');
    if (tripParam) {
      setReviewTripId(tripParam);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: statsData, refetch: refetchStats } = useGetTripStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetPendingReviewTripsQuery({
    page: page + 1,
    limit: pageSize,
    search: search || undefined,
    sort: 'submittedAt:desc',
  });

  const trips = data?.data?.trips || [];
  const pagination = data?.data?.pagination;
  const stats = statsData?.data;

  const columns = useMemo(
    () => [
      {
        field: 'tripNumber',
        headerName: 'Trip #',
        width: 128,
        renderCell: ({ value }) => (
          <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: '0.8125rem' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'driver',
        headerName: 'Driver',
        width: 112,
        valueGetter: (_, row) => row.driver?.name || '—',
        renderCell: ({ value }) => <TruncatedCell value={value} />,
      },
      {
        field: 'vehicle',
        headerName: 'Vehicle',
        width: 92,
        valueGetter: (_, row) => row.vehicle?.vehicleNumber || '—',
        renderCell: ({ value }) => <TruncatedCell value={value} />,
      },
      {
        field: 'route',
        headerName: 'Route',
        flex: 1,
        minWidth: 100,
        sortable: false,
        valueGetter: (_, row) => formatRouteLabel(row.origin, row.destination),
        renderCell: ({ row }) => {
          const label = formatRouteLabel(row.origin, row.destination);
          return <TruncatedCell value={label} title={label} />;
        },
      },
      {
        field: 'distance',
        headerName: 'Distance',
        width: 82,
        valueFormatter: (value) => formatDistance(value),
      },
      {
        field: 'expenses',
        headerName: 'Expenses',
        width: 96,
        valueFormatter: (value) => formatCurrency(value),
      },
      {
        field: 'submittedAt',
        headerName: 'Submitted',
        width: 112,
        valueFormatter: (value) => (value ? format(new Date(value), 'MMM d, HH:mm') : '—'),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 122,
        renderCell: ({ value }) => (
          <Chip label={statusLabels[value] || value} size="small" color={statusColors[value] || 'default'} />
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 108,
        sortable: false,
        renderCell: ({ row }) => (
          <Tooltip title="Review & close trip">
            <Button
              size="small"
              variant="contained"
              startIcon={<RateReviewIcon sx={{ fontSize: 16 }} />}
              onClick={() => setReviewTripId(row.id)}
              sx={{ minWidth: 0, px: 1.25, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
            >
              Review
            </Button>
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <Box>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Trip Review
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review driver-submitted trips, enter revenue and expenses, and close trips for reporting.
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={() => {
            refetch();
            refetchStats();
          }}
          disabled={isFetching}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Review"
            value={stats?.pendingReview ?? 0}
            icon={<PendingActionsIcon />}
            color="#ED6C02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Closed Trips"
            value={stats?.completed ?? 0}
            icon={<RateReviewIcon />}
            color="#2E7D32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Profit (Closed)"
            value={formatCurrency(stats?.totalProfit)}
            icon={<RateReviewIcon />}
            color="#1565C0"
          />
        </Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search trip number, driver, route..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 280 }}
        />
      </Card>

      <Card sx={{ height: 520, p: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isError ? (
          <ErrorState title="Failed to load pending trips" onRetry={refetch} />
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, width: '100%' }}>
            <DataGrid
              rows={trips}
              columns={columns}
              getRowId={(row) => row.id}
              loading={isLoading || isFetching}
              rowCount={pagination?.total ?? 0}
              paginationMode="server"
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setPageSize(model.pageSize);
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={tripGridSx}
              onRowDoubleClick={(params) => setReviewTripId(params.row.id)}
            />
          </Box>
        )}
      </Card>

      <TripReviewDialog
        open={Boolean(reviewTripId)}
        tripId={reviewTripId}
        onClose={() => setReviewTripId(null)}
        onReviewed={() => {
          refetch();
          refetchStats();
        }}
      />
    </Box>
  );
};

export default TripReviewPage;
