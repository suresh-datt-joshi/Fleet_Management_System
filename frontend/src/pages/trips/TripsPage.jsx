import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  InputAdornment,
  Chip,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RouteIcon from '@mui/icons-material/Route';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS, TRIP_STATUS } from '../../constants';
import {
  useGetTripStatsQuery,
  useGetTripAnalyticsQuery,
  useGetTripsQuery,
  useGetTripMetaDriversQuery,
  useGetTripMetaVehiclesQuery,
  useGetTripMetaRoutesQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,
  useStartTripMutation,
  useCompleteTripMutation,
  useCancelTripMutation,
  useExportTripsMutation,
} from '../../redux/api/tripsApi';
import TripFormDialog from '../../features/trips/components/TripFormDialog';
import TripDetailDrawer from '../../features/trips/components/TripDetailDrawer';
import TripAnalyticsPanel from '../../features/trips/components/TripAnalyticsPanel';
import {
  statusColors,
  statusLabels,
  formatCurrency,
  formatLocation,
  canStart,
  canEdit,
  canDelete,
} from '../../features/trips/utils/tripUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';

const TRIP_TAB = {
  ALL: 0,
  COMPLETED: 1,
  ANALYTICS: 2,
};

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

const TripsPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.CREATE_TRIPS);
  const canUpdate = hasPermission(PERMISSIONS.UPDATE_TRIPS);
  const canReview = hasPermission(PERMISSIONS.REVIEW_TRIPS);
  const canDeletePerm = hasPermission(PERMISSIONS.DELETE_TRIPS);

  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [completedPage, setCompletedPage] = useState(0);
  const [completedPageSize, setCompletedPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [detailTrip, setDetailTrip] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
      sort: 'scheduledAt:desc',
    }),
    [page, pageSize, search, statusFilter]
  );

  const completedQueryParams = useMemo(
    () => ({
      page: completedPage + 1,
      limit: completedPageSize,
      statuses: `${TRIP_STATUS.REVIEWED},${TRIP_STATUS.COMPLETED}`,
      sort: 'completedAt:desc',
    }),
    [completedPage, completedPageSize]
  );

  const { data: statsData } = useGetTripStatsQuery();
  const { data: analyticsData, isLoading: analyticsLoading } = useGetTripAnalyticsQuery(
    { months: 6 },
    { skip: tab !== TRIP_TAB.ANALYTICS }
  );
  const { data, isLoading, isError, error, refetch, isFetching } = useGetTripsQuery(queryParams, {
    skip: tab !== TRIP_TAB.ALL,
  });
  const {
    data: completedData,
    isLoading: completedLoading,
    isError: completedError,
    error: completedQueryError,
    refetch: refetchCompleted,
    isFetching: completedFetching,
  } = useGetTripsQuery(completedQueryParams, { skip: tab !== TRIP_TAB.COMPLETED });
  const { data: driversData } = useGetTripMetaDriversQuery(undefined, { skip: !formOpen });
  const { data: vehiclesData } = useGetTripMetaVehiclesQuery(undefined, { skip: !formOpen });
  const { data: routesData } = useGetTripMetaRoutesQuery(undefined, { skip: !formOpen });

  const [createTrip, { isLoading: creating }] = useCreateTripMutation();
  const [updateTrip, { isLoading: updating }] = useUpdateTripMutation();
  const [deleteTrip] = useDeleteTripMutation();
  const [startTrip, { isLoading: starting }] = useStartTripMutation();
  const [completeTrip] = useCompleteTripMutation();
  const [cancelTrip] = useCancelTripMutation();
  const [exportTrips] = useExportTripsMutation();

  const stats = statsData?.data;
  const trips = data?.data?.trips || [];
  const pagination = data?.data?.pagination || {};
  const completedTrips = completedData?.data?.trips || [];
  const completedPagination = completedData?.data?.pagination || {};

  const handleRefresh = () => {
    if (tab === TRIP_TAB.ALL) refetch();
    else if (tab === TRIP_TAB.COMPLETED) refetchCompleted();
  };

  const handleFormSubmit = async (payload) => {
    try {
      const { id, ...body } = payload;
      if (id) {
        await updateTrip({ id, ...body }).unwrap();
        enqueueSnackbar('Trip updated', { variant: 'success' });
      } else {
        await createTrip(body).unwrap();
        enqueueSnackbar('Trip created', { variant: 'success' });
      }
      setFormOpen(false);
      setEditTrip(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleStart = useCallback(
    async (id) => {
      try {
        const result = await startTrip(id).unwrap();
        enqueueSnackbar('Trip started — opening live tracking', { variant: 'success' });
        if (detailTrip?.id === id) setDetailTrip(result.data.trip);
        navigate('/tracking');
      } catch (err) {
        enqueueSnackbar(err?.data?.message || 'Start failed', { variant: 'error' });
      }
    },
    [startTrip, enqueueSnackbar, detailTrip, navigate]
  );

  const handleComplete = async (trip) => {
    try {
      const result = await completeTrip({
        id: trip.id,
        distance: trip.distance,
        fuelUsed: trip.fuelUsed,
        revenue: trip.revenue,
        expenses: trip.expenses,
      }).unwrap();
      enqueueSnackbar('Trip completed', { variant: 'success' });
      setDetailTrip(result.data.trip);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Complete failed', { variant: 'error' });
    }
  };

  const handleCancel = async (id) => {
    try {
      const result = await cancelTrip({ id }).unwrap();
      enqueueSnackbar('Trip cancelled', { variant: 'success' });
      if (detailTrip?.id === id) setDetailTrip(result.data.trip);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Cancel failed', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTrip(deleteConfirm).unwrap();
      enqueueSnackbar('Trip deleted', { variant: 'success' });
      setDeleteConfirm(null);
      if (detailTrip?.id === deleteConfirm) {
        setDetailOpen(false);
        setDetailTrip(null);
      }
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Delete failed', { variant: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportTrips({ status: statusFilter || undefined }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trips-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  const columns = useMemo(
    () => [
      { field: 'tripNumber', headerName: 'Trip #', width: 140 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: ({ value }) => (
          <Chip label={statusLabels[value] || value} size="small" color={statusColors[value] || 'default'} />
        ),
      },
      {
        field: 'driver',
        headerName: 'Driver',
        flex: 1,
        minWidth: 130,
        valueGetter: (value) => value?.name || '—',
      },
      {
        field: 'vehicle',
        headerName: 'Vehicle',
        width: 110,
        valueGetter: (value) => value?.vehicleNumber || '—',
      },
      {
        field: 'origin',
        headerName: 'Origin',
        flex: 1,
        minWidth: 120,
        valueGetter: (value) => formatLocation(value),
      },
      {
        field: 'destination',
        headerName: 'Destination',
        flex: 1,
        minWidth: 120,
        valueGetter: (value) => formatLocation(value),
      },
      {
        field: 'scheduledAt',
        headerName: 'Scheduled',
        width: 130,
        valueFormatter: (value) => (value ? format(new Date(value), 'MMM d, yyyy') : '—'),
      },
      {
        field: 'distance',
        headerName: 'Dist (km)',
        width: 90,
        valueFormatter: (value) => (value ? value : '—'),
      },
      {
        field: 'estimatedCost',
        headerName: 'Est. Cost',
        width: 100,
        valueFormatter: (value) => formatCurrency(value),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: canUpdate ? 130 : 60,
        sortable: false,
        renderCell: ({ row }) => (
          <Box>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => {
                  setDetailTrip(row);
                  setDetailOpen(true);
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canUpdate && canStart(row.status) && (
              <Tooltip title="Start">
                <IconButton size="small" color="primary" onClick={() => handleStart(row.id)}>
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canUpdate && canEdit(row.status) && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditTrip(row);
                    setFormOpen(true);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeletePerm && canDelete(row.status) && (
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => setDeleteConfirm(row.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [canUpdate, canDeletePerm, handleStart]
  );

  const completedColumns = useMemo(
    () => [
      {
        field: 'tripNumber',
        headerName: 'Trip #',
        width: 98,
        renderCell: ({ value }) => <TruncatedCell value={value} />,
      },
      {
        field: 'driver',
        headerName: 'Driver',
        flex: 0.9,
        minWidth: 82,
        maxWidth: 130,
        valueGetter: (value) => value?.name || '—',
        renderCell: ({ value }) => <TruncatedCell value={value} />,
      },
      {
        field: 'vehicle',
        headerName: 'Vehicle',
        width: 82,
        valueGetter: (value) => value?.vehicleNumber || '—',
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
        field: 'completedAt',
        headerName: 'Completed',
        width: 108,
        valueFormatter: (value) => (value ? format(new Date(value), 'MMM d, HH:mm') : '—'),
      },
      {
        field: 'distance',
        headerName: 'Km',
        width: 52,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (value) => (value ? value : '—'),
      },
      {
        field: 'estimatedCost',
        headerName: 'Cost',
        width: 86,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (value) => formatCurrency(value),
        renderCell: ({ value }) => <TruncatedCell value={formatCurrency(value)} />,
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: canDeletePerm ? 96 : 72,
        sortable: false,
        disableColumnMenu: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <Box>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => {
                  setDetailTrip(row);
                  setDetailOpen(true);
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canDeletePerm && canDelete(row.status) && (
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => setDeleteConfirm(row.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [canDeletePerm]
  );

  if (isError && tab === TRIP_TAB.ALL) {
    return <ErrorState title="Failed to load trips" message={error?.data?.message} onRetry={refetch} />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 112px)',
        minHeight: 480,
        minWidth: 0,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2} flexShrink={0}>
        <Typography variant="h4" fontWeight={700}>
          Trip Management
        </Typography>
        <Box display="flex" gap={1}>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={handleRefresh} disabled={isFetching || completedFetching}>
            Refresh
          </Button>
          {tab === TRIP_TAB.ALL && (
            <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExport}>
              Export
            </Button>
          )}
          {canCreate && tab === TRIP_TAB.ALL && (
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setEditTrip(null); setFormOpen(true); }}>
              Create Trip
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} mb={3} flexShrink={0}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Trips" value={stats?.total ?? 0} icon={<RouteIcon />} color="#1565C0" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Scheduled" value={stats?.scheduled ?? 0} icon={<RouteIcon />} color="#0288D1" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="In Progress" value={stats?.inProgress ?? 0} icon={<LocalShippingIcon />} color="#ED6C02" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Pending Review" value={stats?.pendingReview ?? 0} icon={<RouteIcon />} color="#7B1FA2" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Closed" value={stats?.completed ?? 0} icon={<RouteIcon />} color="#2E7D32" />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, flexShrink: 0 }}>
        <Tab label="All Trips" />
        <Tab label={`Closed (${stats?.completed ?? 0})`} />
        <Tab label="Analytics" />
      </Tabs>

      {tab === TRIP_TAB.ALL && (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            minWidth: 0,
          }}
        >
          <Box display="flex" gap={2} flexWrap="wrap" flexShrink={0}>
            <TextField
              size="small"
              placeholder="Search trips..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 220 }}
            />
            <TextField size="small" select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="">All</MenuItem>
              {Object.values(TRIP_STATUS).map((s) => (
                <MenuItem key={s} value={s}>
                  {statusLabels[s] || s}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" onClick={() => setSearch(searchInput)}>
              Search
            </Button>
          </Box>
          <Card sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ flex: 1, minHeight: 0, width: '100%', minWidth: 0 }}>
              <DataGrid
                rows={trips}
                columns={columns}
                getRowId={(row) => row.id}
                loading={isLoading || isFetching}
                paginationMode="server"
                rowCount={pagination.total || 0}
                paginationModel={{ page, pageSize }}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setPageSize(model.pageSize);
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                sx={tripGridSx}
              />
            </Box>
          </Card>
        </Box>
      )}

      {tab === TRIP_TAB.COMPLETED && (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            minWidth: 0,
          }}
        >
          {completedError ? (
            <ErrorState
              title="Failed to load completed trips"
              message={completedQueryError?.data?.message}
              onRetry={refetchCompleted}
            />
          ) : (
            <Card sx={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
                <DataGrid
                  rows={completedTrips}
                  columns={completedColumns}
                  getRowId={(row) => row.id}
                  loading={completedLoading || completedFetching}
                  paginationMode="server"
                  rowCount={completedPagination.total || 0}
                  paginationModel={{ page: completedPage, pageSize: completedPageSize }}
                  onPaginationModelChange={(model) => {
                    setCompletedPage(model.page);
                    setCompletedPageSize(model.pageSize);
                  }}
                  pageSizeOptions={[10, 25, 50]}
                  disableRowSelectionOnClick
                  density="compact"
                  columnHeaderHeight={40}
                  rowHeight={48}
                  sx={tripGridSx}
                />
              </Box>
            </Card>
          )}
        </Box>
      )}

      {tab === TRIP_TAB.ANALYTICS && <TripAnalyticsPanel analytics={analyticsData?.data} isLoading={analyticsLoading} />}

      <TripFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTrip(null); }}
        onSubmit={handleFormSubmit}
        initialData={editTrip}
        isLoading={creating || updating}
        drivers={driversData?.data || []}
        vehicles={vehiclesData?.data || []}
        routes={routesData?.data || []}
      />

      <TripDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailTrip(null); }}
        trip={detailTrip}
        onEdit={(t) => { setEditTrip(t); setFormOpen(true); }}
        onStart={handleStart}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onDelete={setDeleteConfirm}
        canUpdate={canUpdate}
        canReview={canReview}
        canDeletePerm={canDeletePerm}
        loadingAction={starting}
      />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Trip</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This trip will be permanently removed. Linked fuel logs will remain in the Fuel section for audit
            purposes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripsPage;
