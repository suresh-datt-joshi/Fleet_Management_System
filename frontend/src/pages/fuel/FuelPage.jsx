import { useState, useMemo } from 'react';
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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants';
import {
  useGetFuelStatsQuery,
  useGetFuelAnalyticsQuery,
  useGetFuelLogsQuery,
  useGetFuelStationsQuery,
  useGetMetaVehiclesQuery,
  useGetMetaStationsQuery,
  useCreateFuelLogMutation,
  useUpdateFuelLogMutation,
  useDeleteFuelLogMutation,
  useCreateFuelStationMutation,
  useUpdateFuelStationMutation,
  useDeleteFuelStationMutation,
  useExportFuelLogsMutation,
} from '../../redux/api/fuelApi';
import FuelLogFormDialog from '../../features/fuel/components/FuelLogFormDialog';
import FuelStationFormDialog from '../../features/fuel/components/FuelStationFormDialog';
import FuelAnalyticsPanel from '../../features/fuel/components/FuelAnalyticsPanel';
import {
  FUEL_TYPES,
  fuelTypeLabels,
  stationStatusColors,
  formatCurrency,
  formatQuantity,
  formatMileage,
} from '../../features/fuel/utils/fuelUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';
import SpeedIcon from '@mui/icons-material/Speed';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const FuelPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.MANAGE_FUEL);

  const [tab, setTab] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logPageSize, setLogPageSize] = useState(10);
  const [stationPage, setStationPage] = useState(0);
  const [stationPageSize, setStationPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');

  const [logFormOpen, setLogFormOpen] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [stationFormOpen, setStationFormOpen] = useState(false);
  const [editStation, setEditStation] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const logParams = useMemo(
    () => ({
      page: logPage + 1,
      limit: logPageSize,
      search: search || undefined,
      fuelType: fuelTypeFilter || undefined,
      sort: 'loggedAt:desc',
    }),
    [logPage, logPageSize, search, fuelTypeFilter]
  );

  const stationParams = useMemo(
    () => ({
      page: stationPage + 1,
      limit: stationPageSize,
      search: search || undefined,
      sort: 'name:asc',
    }),
    [stationPage, stationPageSize, search]
  );

  const { data: statsData } = useGetFuelStatsQuery();
  const { data: analyticsData, isLoading: analyticsLoading } = useGetFuelAnalyticsQuery({ months: 6 });
  const { data: logsData, isLoading: logsLoading, isError: logsError, error: logsErr, refetch: refetchLogs, isFetching: logsFetching } =
    useGetFuelLogsQuery(logParams, { skip: tab !== 0 });
  const { data: stationsData, isLoading: stationsLoading, refetch: refetchStations, isFetching: stationsFetching } =
    useGetFuelStationsQuery(stationParams, { skip: tab !== 1 });
  const { data: vehiclesData } = useGetMetaVehiclesQuery(undefined, { skip: !logFormOpen });
  const { data: metaStationsData } = useGetMetaStationsQuery(undefined, { skip: !logFormOpen });

  const [createLog, { isLoading: creatingLog }] = useCreateFuelLogMutation();
  const [updateLog, { isLoading: updatingLog }] = useUpdateFuelLogMutation();
  const [deleteLog] = useDeleteFuelLogMutation();
  const [createStation, { isLoading: creatingStation }] = useCreateFuelStationMutation();
  const [updateStation, { isLoading: updatingStation }] = useUpdateFuelStationMutation();
  const [deleteStation] = useDeleteFuelStationMutation();
  const [exportLogs] = useExportFuelLogsMutation();

  const stats = statsData?.data;
  const logs = logsData?.data?.logs || [];
  const logsPagination = logsData?.data?.pagination || {};
  const stations = stationsData?.data?.stations || [];
  const stationsPagination = stationsData?.data?.pagination || {};

  const handleLogSubmit = async (payload) => {
    try {
      if (editLog?.id) {
        await updateLog({ id: editLog.id, ...payload }).unwrap();
        enqueueSnackbar('Fuel log updated', { variant: 'success' });
      } else {
        await createLog(payload).unwrap();
        enqueueSnackbar('Fuel logged successfully', { variant: 'success' });
      }
      setLogFormOpen(false);
      setEditLog(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleStationSubmit = async (payload) => {
    try {
      if (editStation?.id) {
        await updateStation({ id: editStation.id, ...payload }).unwrap();
        enqueueSnackbar('Station updated', { variant: 'success' });
      } else {
        await createStation(payload).unwrap();
        enqueueSnackbar('Station added', { variant: 'success' });
      }
      setStationFormOpen(false);
      setEditStation(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'log') {
        await deleteLog(deleteConfirm.id).unwrap();
        enqueueSnackbar('Fuel log deleted', { variant: 'success' });
      } else {
        await deleteStation(deleteConfirm.id).unwrap();
        enqueueSnackbar('Station deleted', { variant: 'success' });
      }
      setDeleteConfirm(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Delete failed', { variant: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportLogs({ fuelType: fuelTypeFilter || undefined }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fuel-logs-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  const logColumns = useMemo(
    () => [
      {
        field: 'loggedAt',
        headerName: 'Date',
        width: 120,
        valueFormatter: (value) => (value ? format(new Date(value), 'MMM d, yyyy') : '—'),
      },
      {
        field: 'vehicle',
        headerName: 'Vehicle',
        width: 120,
        valueGetter: (value) => value?.vehicleNumber || '—',
      },
      {
        field: 'trip',
        headerName: 'Trip',
        width: 130,
        valueGetter: (value, row) => row.trip?.tripNumber || '—',
      },
      {
        field: 'station',
        headerName: 'Station',
        flex: 1,
        minWidth: 140,
        valueGetter: (value, row) => row.station?.name || row.fuelStation || '—',
      },
      {
        field: 'fuelType',
        headerName: 'Type',
        width: 90,
        valueGetter: (value) => fuelTypeLabels[value] || value,
      },
      {
        field: 'quantity',
        headerName: 'Qty',
        width: 80,
        valueFormatter: (value) => formatQuantity(value),
      },
      {
        field: 'cost',
        headerName: 'Cost',
        width: 100,
        valueFormatter: (value) => formatCurrency(value),
      },
      {
        field: 'mileage',
        headerName: 'Mileage',
        width: 100,
        valueFormatter: (value) => formatMileage(value),
      },
      {
        field: 'odometer',
        headerName: 'Odometer',
        width: 100,
        valueFormatter: (value) => (value ? `${value} km` : '—'),
      },
      ...(canManage
        ? [
            {
              field: 'actions',
              headerName: 'Actions',
              width: 100,
              sortable: false,
              renderCell: ({ row }) => (
                <Box>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditLog(row);
                        setLogFormOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirm({ type: 'log', id: row.id })}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            },
          ]
        : []),
    ],
    [canManage]
  );

  const stationColumns = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
      { field: 'brand', headerName: 'Brand', width: 100 },
      { field: 'city', headerName: 'City', width: 120 },
      {
        field: 'fuelTypes',
        headerName: 'Fuel Types',
        width: 180,
        renderCell: ({ value }) =>
          (value || []).map((t) => (
            <Chip key={t} label={fuelTypeLabels[t] || t} size="small" sx={{ mr: 0.5 }} />
          )),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 100,
        renderCell: ({ value }) => (
          <Chip label={value} size="small" color={stationStatusColors[value] || 'default'} sx={{ textTransform: 'capitalize' }} />
        ),
      },
      ...(canManage
        ? [
            {
              field: 'actions',
              headerName: 'Actions',
              width: 100,
              sortable: false,
              renderCell: ({ row }) => (
                <Box>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditStation(row);
                        setStationFormOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirm({ type: 'station', id: row.id })}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            },
          ]
        : []),
    ],
    [canManage]
  );

  if (logsError && tab === 0) {
    return <ErrorState title="Failed to load fuel data" message={logsErr?.data?.message} onRetry={refetchLogs} />;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight={700}>
          Fuel Management
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={() => (tab === 0 ? refetchLogs() : tab === 1 ? refetchStations() : null)}
          >
            Refresh
          </Button>
          {tab === 0 && (
            <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExport}>
              Export
            </Button>
          )}
          {canManage && tab === 0 && (
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setEditLog(null); setLogFormOpen(true); }}>
              Log Fuel
            </Button>
          )}
          {canManage && tab === 1 && (
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setEditStation(null); setStationFormOpen(true); }}>
              Add Station
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Logs" value={stats?.totalLogs ?? 0} icon={<LocalGasStationIcon />} color="#1565C0" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="This Month" value={formatQuantity(stats?.quantityThisMonth)} icon={<LocalGasStationIcon />} color="#2E7D32" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Cost (Month)" value={formatCurrency(stats?.costThisMonth)} icon={<AttachMoneyIcon />} color="#ED6C02" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Avg Mileage" value={formatMileage(stats?.averageMileage)} icon={<SpeedIcon />} color="#7B1FA2" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Stations" value={stats?.activeStations ?? 0} icon={<LocalGasStationIcon />} color="#00897B" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Total Spend" value={formatCurrency(stats?.totalCostAllTime)} icon={<AttachMoneyIcon />} color="#D32F2F" />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Fuel Logs" />
        <Tab label="Stations" />
        <Tab label="Analytics" />
      </Tabs>

      {(tab === 0 || tab === 1) && (
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search..."
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
          {tab === 0 && (
            <TextField
              size="small"
              select
              label="Fuel Type"
              value={fuelTypeFilter}
              onChange={(e) => setFuelTypeFilter(e.target.value)}
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="">All</MenuItem>
              {Object.values(FUEL_TYPES).map((t) => (
                <MenuItem key={t} value={t}>
                  {fuelTypeLabels[t]}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Button variant="outlined" onClick={() => setSearch(searchInput)}>
            Search
          </Button>
        </Box>
      )}

      {tab === 0 && (
        <Box sx={{ height: 520 }}>
          <DataGrid
            rows={logs}
            columns={logColumns}
            getRowId={(row) => row.id}
            loading={logsLoading || logsFetching}
            paginationMode="server"
            rowCount={logsPagination.total || 0}
            paginationModel={{ page: logPage, pageSize: logPageSize }}
            onPaginationModelChange={(model) => {
              setLogPage(model.page);
              setLogPageSize(model.pageSize);
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
          />
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ height: 520 }}>
          <DataGrid
            rows={stations}
            columns={stationColumns}
            getRowId={(row) => row.id}
            loading={stationsLoading || stationsFetching}
            paginationMode="server"
            rowCount={stationsPagination.total || 0}
            paginationModel={{ page: stationPage, pageSize: stationPageSize }}
            onPaginationModelChange={(model) => {
              setStationPage(model.page);
              setStationPageSize(model.pageSize);
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
          />
        </Box>
      )}

      {tab === 2 && (
        <FuelAnalyticsPanel analytics={analyticsData?.data} isLoading={analyticsLoading} />
      )}

      <FuelLogFormDialog
        open={logFormOpen}
        onClose={() => { setLogFormOpen(false); setEditLog(null); }}
        onSubmit={handleLogSubmit}
        initialData={editLog}
        isLoading={creatingLog || updatingLog}
        vehicles={vehiclesData?.data || []}
        stations={metaStationsData?.data || []}
      />

      <FuelStationFormDialog
        open={stationFormOpen}
        onClose={() => { setStationFormOpen(false); setEditStation(null); }}
        onSubmit={handleStationSubmit}
        initialData={editStation}
        isLoading={creatingStation || updatingStation}
      />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteConfirm?.type === 'station'
              ? 'This station cannot be deleted if it has linked fuel logs.'
              : 'This fuel log will be permanently removed.'}
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

export default FuelPage;
