import { useState, useMemo, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useSnackbar } from 'notistack';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants';
import {
  useGetRoutesQuery,
  useGetRouteStatsQuery,
  useGetTrafficPreviewQuery,
  useCreateRouteMutation,
  useUpdateRouteMutation,
  useDeleteRouteMutation,
  useOptimizeRouteMutation,
  useExportRoutesMutation,
} from '../../redux/api/routesApi';
import RouteFormDialog from '../../features/routes/components/RouteFormDialog';
import RouteDetailDrawer from '../../features/routes/components/RouteDetailDrawer';
import {
  ROUTE_STATUS,
  statusColors,
  trafficColors,
  formatDistance,
  formatDuration,
} from '../../features/routes/utils/routeUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';
import RouteIcon from '@mui/icons-material/Route';

const RoutesPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.MANAGE_ROUTES);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editRoute, setEditRoute] = useState(null);
  const [detailRoute, setDetailRoute] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
      sort: 'createdAt:desc',
    }),
    [page, pageSize, search, statusFilter]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useGetRoutesQuery(queryParams);
  const { data: statsData } = useGetRouteStatsQuery();
  const { data: trafficData } = useGetTrafficPreviewQuery(undefined, { pollingInterval: 60000 });

  const [createRoute, { isLoading: creating }] = useCreateRouteMutation();
  const [updateRoute, { isLoading: updating }] = useUpdateRouteMutation();
  const [deleteRoute, { isLoading: deleting }] = useDeleteRouteMutation();
  const [optimizeRoute, { isLoading: optimizing }] = useOptimizeRouteMutation();
  const [exportRoutes] = useExportRoutesMutation();

  const routes = data?.data?.routes || [];
  const pagination = data?.data?.pagination || {};
  const stats = statsData?.data;
  const traffic = trafficData?.data;

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (editRoute?.id) {
        await updateRoute({ id: editRoute.id, ...payload }).unwrap();
        enqueueSnackbar('Route updated', { variant: 'success' });
        if (detailRoute?.id === editRoute.id) {
          setDetailRoute({ ...detailRoute, ...payload });
        }
      } else {
        await createRoute(payload).unwrap();
        enqueueSnackbar('Route created', { variant: 'success' });
      }
      setFormOpen(false);
      setEditRoute(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleOptimize = useCallback(
    async (id) => {
      try {
        const result = await optimizeRoute(id).unwrap();
        const saved = result.data?.route;
        const savings = result.data?.optimization?.savings?.durationMinutes || 0;
        enqueueSnackbar(
          savings > 0
            ? `Route updated for live traffic — ${savings} min faster`
            : 'Route updated for current traffic conditions',
          { variant: 'success' }
        );
        if (detailRoute?.id === id && saved) setDetailRoute(saved);
      } catch (err) {
        enqueueSnackbar(err?.data?.message || 'Optimization failed', { variant: 'error' });
      }
    },
    [optimizeRoute, enqueueSnackbar, detailRoute]
  );

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRoute(deleteConfirm).unwrap();
      enqueueSnackbar('Route deleted', { variant: 'success' });
      setDeleteConfirm(null);
      if (detailRoute?.id === deleteConfirm) {
        setDetailOpen(false);
        setDetailRoute(null);
      }
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Delete failed', { variant: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportRoutes({ status: statusFilter || undefined, search: search || undefined }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `routes-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  const columns = useMemo(
    () => [
      { field: 'routeNumber', headerName: 'Route #', width: 130 },
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
      {
        field: 'status',
        headerName: 'Status',
        width: 110,
        renderCell: ({ value }) => (
          <Chip label={value} size="small" color={statusColors[value] || 'default'} sx={{ textTransform: 'capitalize' }} />
        ),
      },
      {
        field: 'stops',
        headerName: 'Stops',
        width: 80,
        valueGetter: (value, row) => row.stops?.length || 0,
      },
      {
        field: 'totalDistanceMeters',
        headerName: 'Distance',
        width: 100,
        valueGetter: (value) => formatDistance(value),
      },
      {
        field: 'estimatedDurationMinutes',
        headerName: 'ETA',
        width: 90,
        valueGetter: (value) => formatDuration(value),
      },
      {
        field: 'trafficLevel',
        headerName: 'Traffic',
        width: 100,
        renderCell: ({ value }) => (
          <Chip label={value} size="small" color={trafficColors[value] || 'default'} sx={{ textTransform: 'capitalize' }} />
        ),
      },
      {
        field: 'isOptimized',
        headerName: 'Optimized',
        width: 100,
        renderCell: ({ value }) => (value ? <Chip label="Yes" size="small" color="primary" variant="outlined" /> : '—'),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: canManage ? 160 : 80,
        sortable: false,
        renderCell: ({ row }) => (
          <Box>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => {
                  setDetailRoute(row);
                  setDetailOpen(true);
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canManage && (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditRoute(row);
                      setFormOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Optimize for live traffic">
                  <IconButton size="small" onClick={() => handleOptimize(row.id)} disabled={optimizing}>
                    <AutoFixHighIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        ),
      },
    ],
    [canManage, handleOptimize, optimizing]
  );

  if (isError) {
    return <ErrorState title="Failed to load routes" message={error?.data?.message} onRetry={refetch} />;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Route Management
          </Typography>
          {traffic && (
            <Chip
              label={`Traffic: ${traffic.level} — ${traffic.description}`}
              size="small"
              color={trafficColors[traffic.level] || 'default'}
              sx={{ mt: 1, maxWidth: '100%' }}
            />
          )}
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={refetch} disabled={isFetching}>
            Refresh
          </Button>
          <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExport}>
            Export
          </Button>
          {canManage && (
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setEditRoute(null); setFormOpen(true); }}>
              Create Route
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Routes" value={stats?.total ?? 0} icon={<RouteIcon />} color="#1565C0" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Active" value={stats?.active ?? 0} icon={<RouteIcon />} color="#2E7D32" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Optimized" value={stats?.optimized ?? 0} icon={<AutoFixHighIcon />} color="#7B1FA2" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Avg Area Covered" value={`${stats?.averageAreaCoveredKm ?? 0} km`} icon={<RouteIcon />} color="#ED6C02" />
        </Grid>
      </Grid>

      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search routes..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 240 }}
        />
        <TextField
          size="small"
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          {Object.values(ROUTE_STATUS).map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      <Box sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={routes}
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
          sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
        />
      </Box>

      <RouteFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRoute(null); }}
        onSubmit={handleFormSubmit}
        initialData={editRoute}
        isLoading={creating || updating}
      />

      <RouteDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailRoute(null); }}
        route={detailRoute}
        onEdit={(r) => { setEditRoute(r); setFormOpen(true); }}
        onOptimize={handleOptimize}
        onDelete={(id) => setDeleteConfirm(id)}
        canManage={canManage}
        optimizing={optimizing}
        deleting={deleting}
      />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Route</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {detailRoute?.id === deleteConfirm
              ? `Delete "${detailRoute.name}"? This route will be archived and removed from active lists.`
              : 'This route will be archived and removed from active lists.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoutesPage;
