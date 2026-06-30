import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import { useSnackbar } from 'notistack';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS, DRIVER_STATUS } from '../../constants';
import {
  useGetDriversQuery,
  useGetDriverStatsQuery,
  useGetAvailableVehiclesQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useDeleteDriverMutation,
  useAssignVehicleMutation,
  useUnassignVehicleMutation,
  useUploadDriverAvatarMutation,
  useUploadDriverDocumentMutation,
  useDeleteDriverDocumentMutation,
  useExportDriversMutation,
} from '../../redux/api/driversApi';
import DriverFormDialog from '../../features/drivers/components/DriverFormDialog';
import DriverDetailDrawer from '../../features/drivers/components/DriverDetailDrawer';
import AssignVehicleDialog from '../../features/drivers/components/AssignVehicleDialog';
import { statusColors } from '../../features/drivers/utils/driverUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';

const DriversPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [detailDriver, setDetailDriver] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDriverId, setAssignDriverId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
      assigned: assignedFilter || undefined,
      sort: 'createdAt:desc',
    }),
    [page, pageSize, search, statusFilter, assignedFilter]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useGetDriversQuery(queryParams);
  const { data: statsData } = useGetDriverStatsQuery();
  const { data: vehiclesData } = useGetAvailableVehiclesQuery(undefined, { skip: !assignOpen });

  const [createDriver, { isLoading: creating }] = useCreateDriverMutation();
  const [updateDriver, { isLoading: updating }] = useUpdateDriverMutation();
  const [deleteDriver] = useDeleteDriverMutation();
  const [assignVehicle] = useAssignVehicleMutation();
  const [unassignVehicle] = useUnassignVehicleMutation();
  const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadDriverAvatarMutation();
  const [uploadDocument] = useUploadDriverDocumentMutation();
  const [deleteDocument] = useDeleteDriverDocumentMutation();
  const [exportDrivers] = useExportDriversMutation();

  const drivers = data?.data?.drivers || [];
  const pagination = data?.data?.pagination || {};
  const stats = statsData?.data;

  const openDetail = useCallback((driver) => {
    setDetailDriver(driver);
    setDetailOpen(true);
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editDriver) {
        const result = await updateDriver({ id: editDriver._id, ...formData }).unwrap();
        enqueueSnackbar('Driver updated successfully', { variant: 'success' });
        if (detailDriver?._id === editDriver._id) setDetailDriver(result.data.driver);
      } else {
        await createDriver(formData).unwrap();
        enqueueSnackbar('Driver created successfully', { variant: 'success' });
      }
      setFormOpen(false);
      setEditDriver(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Driver',
        flex: 1,
        minWidth: 160,
        valueGetter: (_, row) => {
          const name = `${row.firstName} ${row.lastName}`;
          const id = row.employeeId || row.licenseNumber;
          return id ? `${name} (${id})` : name;
        },
        renderCell: (params) => {
          const name = `${params.row.firstName} ${params.row.lastName}`;
          const id = params.row.employeeId || params.row.licenseNumber;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" fontWeight={600}>
                {name}
                {id && (
                  <Typography component="span" variant="body2" color="text.secondary" fontWeight={400}>
                    {' '}({id})
                  </Typography>
                )}
              </Typography>
            </Box>
          );
        },
      },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 160 },
      { field: 'phone', headerName: 'Phone', width: 130 },
      { field: 'licenseNumber', headerName: 'License', width: 120 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => (
          <Chip label={params.value?.replace('_', ' ')} size="small" color={statusColors[params.value] || 'default'} sx={{ textTransform: 'capitalize' }} />
        ),
      },
      {
        field: 'performanceScore',
        headerName: 'Score',
        width: 80,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" fontWeight={600} color={params.value >= 80 ? 'success.main' : params.value >= 60 ? 'warning.main' : 'error.main'}>
              {params.value}%
            </Typography>
          </Box>
        ),
      },
      {
        field: 'assignedVehicle',
        headerName: 'Vehicle',
        width: 110,
        valueGetter: (_, row) => row.assignedVehicle?.vehicleNumber || '—',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 130,
        sortable: false,
        renderCell: (params) => (
          <Box>
            <Tooltip title="View"><IconButton size="small" onClick={() => openDetail(params.row)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
            {hasPermission(PERMISSIONS.UPDATE_DRIVERS) && (
              <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditDriver(params.row); setFormOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
            )}
            {hasPermission(PERMISSIONS.ASSIGN_DRIVERS) && (
              <Tooltip title="Assign Vehicle"><IconButton size="small" onClick={() => { setAssignDriverId(params.row._id); setAssignOpen(true); }}><LocalShippingIcon fontSize="small" /></IconButton></Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [hasPermission, openDetail]
  );

  if (isError) return <ErrorState message={error?.data?.message || 'Failed to load drivers'} onRetry={refetch} />;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Driver Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage drivers, licenses, documents, and assignments</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh"><IconButton onClick={refetch} disabled={isFetching}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={async () => {
            try {
              const blob = await exportDrivers({ search, status: statusFilter, assigned: assignedFilter }).unwrap();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `drivers-${Date.now()}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              enqueueSnackbar('Export downloaded', { variant: 'success' });
            } catch { enqueueSnackbar('Export failed', { variant: 'error' }); }
          }}>Export CSV</Button>
          {hasPermission(PERMISSIONS.CREATE_DRIVERS) && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditDriver(null); setFormOpen(true); }}>Add Driver</Button>
          )}
        </Box>
      </Box>

      {stats && (
        <Grid container spacing={2} mb={3}>
          {[
            { title: 'Total Drivers', value: stats.total, color: '#1565C0' },
            { title: 'Available', value: stats.available, color: '#2E7D32' },
            { title: 'On Trip', value: stats.onTrip, color: '#0288D1' },
            { title: 'Avg Score', value: `${stats.averagePerformanceScore}%`, color: '#7B1FA2' },
          ].map((s, i) => (
            <Grid item xs={6} sm={3} key={s.title}>
              <StatCard title={s.title} value={s.value} icon={<PeopleIcon />} color={s.color} index={i} />
            </Grid>
          ))}
        </Grid>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Search name, email, license..." value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setSearch(searchInput), setPage(0))}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth select size="small" label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {Object.values(DRIVER_STATUS).map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth select size="small" label="Assignment" value={assignedFilter} onChange={(e) => { setAssignedFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Assigned</MenuItem>
                <MenuItem value="false">Unassigned</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" onClick={() => { setSearch(searchInput); setPage(0); }}>Search</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <DataGrid rows={drivers} columns={columns} getRowId={(row) => row._id} loading={isLoading || isFetching}
          rowCount={pagination.total || 0} paginationMode="server" paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize); }}
          pageSizeOptions={[5, 10, 25, 50]} disableRowSelectionOnClick autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' } }}
          onRowClick={(params) => openDetail(params.row)} />
      </Card>

      <DriverFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditDriver(null); }} onSubmit={handleCreateOrUpdate} driver={editDriver} isLoading={creating || updating} />

      <DriverDetailDrawer
        open={detailOpen} onClose={() => setDetailOpen(false)} driver={detailDriver}
        onEdit={() => { setEditDriver(detailDriver); setFormOpen(true); }}
        onAssign={() => { setAssignDriverId(detailDriver._id); setAssignOpen(true); }}
        onUnassign={async () => {
          try {
            const result = await unassignVehicle(detailDriver._id).unwrap();
            setDetailDriver(result.data.driver);
            enqueueSnackbar('Vehicle unassigned', { variant: 'success' });
          } catch (err) { enqueueSnackbar(err?.data?.message || 'Failed', { variant: 'error' }); }
        }}
        onDelete={() => setDeleteConfirm(detailDriver)}
        onUploadAvatar={async (file) => {
          try {
            const result = await uploadAvatar({ driverId: detailDriver._id, file }).unwrap();
            setDetailDriver(result.data.driver);
            enqueueSnackbar('Photo uploaded', { variant: 'success' });
          } catch (err) { enqueueSnackbar(err?.data?.message || 'Upload failed', { variant: 'error' }); }
        }}
        onUploadDocument={async ({ file, type, name, expiryDate }) => {
          try {
            const result = await uploadDocument({ driverId: detailDriver._id, file, type, name, expiryDate }).unwrap();
            setDetailDriver(result.data.driver);
            enqueueSnackbar('Document uploaded', { variant: 'success' });
          } catch (err) { enqueueSnackbar(err?.data?.message || 'Upload failed', { variant: 'error' }); }
        }}
        onDeleteDocument={async (documentId) => {
          try {
            const result = await deleteDocument({ driverId: detailDriver._id, documentId }).unwrap();
            setDetailDriver(result.data.driver);
            enqueueSnackbar('Document removed', { variant: 'success' });
          } catch (err) { enqueueSnackbar(err?.data?.message || 'Failed', { variant: 'error' }); }
        }}
        canUpdate={hasPermission(PERMISSIONS.UPDATE_DRIVERS)}
        canDelete={hasPermission(PERMISSIONS.DELETE_DRIVERS)}
        canAssign={hasPermission(PERMISSIONS.ASSIGN_DRIVERS)}
        isUploading={uploadingAvatar}
      />

      <AssignVehicleDialog open={assignOpen} onClose={() => { setAssignOpen(false); setAssignDriverId(null); }}
        vehicles={vehiclesData?.data || []}
        onAssign={async (vehicleId) => {
          try {
            const result = await assignVehicle({ driverId: assignDriverId, vehicleId }).unwrap();
            if (detailDriver?._id === assignDriverId) setDetailDriver(result.data.driver);
            enqueueSnackbar('Vehicle assigned', { variant: 'success' });
          } catch (err) { enqueueSnackbar(err?.data?.message || 'Assignment failed', { variant: 'error' }); }
        }}
      />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Driver</DialogTitle>
        <DialogContent>
          <DialogContentText>Delete <strong>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong>? This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            try {
              await deleteDriver(deleteConfirm._id).unwrap();
              enqueueSnackbar('Driver deleted', { variant: 'success' });
              setDeleteConfirm(null); setDetailOpen(false); setDetailDriver(null);
            } catch (err) { enqueueSnackbar(err?.data?.message || 'Delete failed', { variant: 'error' }); }
          }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriversPage;
