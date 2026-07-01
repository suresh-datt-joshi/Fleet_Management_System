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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useSnackbar } from 'notistack';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS, VEHICLE_STATUS } from '../../constants';
import {
  useGetVehiclesQuery,
  useGetVehicleStatsQuery,
  useGetAvailableDriversQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useAssignDriverMutation,
  useUnassignDriverMutation,
  useUploadVehicleImageMutation,
  useDeleteVehicleImageMutation,
  useExportVehiclesMutation,
} from '../../redux/api/vehiclesApi';
import VehicleFormDialog from '../../features/vehicles/components/VehicleFormDialog';
import VehicleDetailDrawer from '../../features/vehicles/components/VehicleDetailDrawer';
import AssignDriverDialog from '../../features/vehicles/components/AssignDriverDialog';
import MaintenanceFormDialog from '../../features/maintenance/components/MaintenanceFormDialog';
import {
  useGetMaintenanceMetaVehiclesQuery,
  useGetMaintenanceMetaMechanicsQuery,
  useCreateMaintenanceMutation,
} from '../../redux/api/maintenanceApi';
import { statusColors, fuelTypeLabels } from '../../features/vehicles/utils/vehicleUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const VehiclesPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignVehicleId, setAssignVehicleId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false);
  const [scheduleVehicleId, setScheduleVehicleId] = useState(null);

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

  const { data, isLoading, isError, error, refetch, isFetching } = useGetVehiclesQuery(queryParams);
  const { data: statsData } = useGetVehicleStatsQuery();
  const { data: driversData } = useGetAvailableDriversQuery(undefined, {
    skip: !assignOpen,
  });

  const [createVehicle, { isLoading: creating }] = useCreateVehicleMutation();
  const [updateVehicle, { isLoading: updating }] = useUpdateVehicleMutation();
  const [deleteVehicle] = useDeleteVehicleMutation();
  const [assignDriver] = useAssignDriverMutation();
  const [unassignDriver] = useUnassignDriverMutation();
  const [uploadImage, { isLoading: uploading }] = useUploadVehicleImageMutation();
  const [deleteImage] = useDeleteVehicleImageMutation();
  const [exportVehicles] = useExportVehiclesMutation();
  const [createMaintenance, { isLoading: schedulingMaintenance }] = useCreateMaintenanceMutation();
  const { data: maintenanceVehiclesData } = useGetMaintenanceMetaVehiclesQuery(undefined, { skip: !maintenanceFormOpen });
  const { data: maintenanceMechanicsData } = useGetMaintenanceMetaMechanicsQuery(undefined, { skip: !maintenanceFormOpen });

  const vehicles = data?.data?.vehicles || [];
  const pagination = data?.data?.pagination || {};
  const stats = statsData?.data;

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editVehicle) {
        await updateVehicle({ id: editVehicle._id, ...formData }).unwrap();
        enqueueSnackbar('Vehicle updated successfully', { variant: 'success' });
        if (detailVehicle?._id === editVehicle._id) {
          setDetailVehicle({ ...detailVehicle, ...formData });
        }
      } else {
        await createVehicle(formData).unwrap();
        enqueueSnackbar('Vehicle created successfully', { variant: 'success' });
      }
      setFormOpen(false);
      setEditVehicle(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteVehicle(deleteConfirm._id).unwrap();
      enqueueSnackbar('Vehicle deleted', { variant: 'success' });
      setDeleteConfirm(null);
      setDetailOpen(false);
      setDetailVehicle(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Delete failed', { variant: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportVehicles({ search, status: statusFilter, assigned: assignedFilter }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vehicles-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Export downloaded', { variant: 'success' });
    } catch {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  const openDetail = useCallback((vehicle) => {
    setDetailVehicle(vehicle);
    setDetailOpen(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        field: 'vehicleNumber',
        headerName: 'Vehicle #',
        flex: 1,
        minWidth: 110,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" fontWeight={600}>
              {params.value}
            </Typography>
          </Box>
        ),
      },
      { field: 'manufacturer', headerName: 'Manufacturer', flex: 1, minWidth: 120 },
      { field: 'model', headerName: 'Model', flex: 1, minWidth: 100 },
      { field: 'year', headerName: 'Year', width: 80 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            color={statusColors[params.value] || 'default'}
            sx={{ textTransform: 'capitalize' }}
          />
        ),
      },
      {
        field: 'fuelType',
        headerName: 'Fuel',
        width: 90,
        valueGetter: (value) => fuelTypeLabels[value] || value,
      },
      {
        field: 'assignedDriver',
        headerName: 'Driver',
        flex: 1,
        minWidth: 130,
        valueGetter: (value, row) =>
          row.assignedDriver
            ? `${row.assignedDriver.firstName} ${row.assignedDriver.lastName}`
            : 'Unassigned',
      },
      {
        field: 'fuelLevel',
        headerName: 'Fuel %',
        width: 80,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color={params.value < 20 ? 'error.main' : 'text.primary'}>
              {Math.round(params.value ?? 0)}%
            </Typography>
          </Box>
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 140,
        sortable: false,
        renderCell: (params) => (
          <Box>
            <Tooltip title="View">
              <IconButton size="small" onClick={() => openDetail(params.row)}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {hasPermission(PERMISSIONS.UPDATE_VEHICLES) && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditVehicle(params.row);
                    setFormOpen(true);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasPermission(PERMISSIONS.ASSIGN_VEHICLES) && (
              <Tooltip title="Assign Driver">
                <IconButton
                  size="small"
                  onClick={() => {
                    setAssignVehicleId(params.row._id);
                    setAssignOpen(true);
                  }}
                >
                  <PersonAddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [hasPermission, openDetail]
  );

  if (isError) {
    return <ErrorState message={error?.data?.message || 'Failed to load vehicles'} onRetry={refetch} />;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Vehicle Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage fleet vehicles, documents, and assignments
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={refetch} disabled={isFetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport}>
            Export CSV
          </Button>
          {hasPermission(PERMISSIONS.CREATE_VEHICLES) && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditVehicle(null);
                setFormOpen(true);
              }}
            >
              Add Vehicle
            </Button>
          )}
        </Box>
      </Box>

      {stats && (
        <Grid container spacing={2} mb={3}>
          {[
            { title: 'Total', value: stats.total, color: '#1565C0' },
            { title: 'Active', value: stats.active, color: '#2E7D32' },
            { title: 'Maintenance', value: stats.maintenance, color: '#ED6C02' },
            { title: 'Assigned', value: stats.assigned, color: '#00897B' },
          ].map((s, i) => (
            <Grid item xs={6} sm={3} key={s.title}>
              <StatCard
                title={s.title}
                value={s.value}
                icon={<LocalShippingIcon />}
                color={s.color}
                index={i}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by number, VIN, model..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(VEHICLE_STATUS).map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                select
                size="small"
                label="Assignment"
                value={assignedFilter}
                onChange={(e) => {
                  setAssignedFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Assigned</MenuItem>
                <MenuItem value="false">Unassigned</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" onClick={handleSearch}>
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={vehicles}
          columns={columns}
          getRowId={(row) => row._id}
          loading={isLoading || isFetching}
          rowCount={pagination.total || 0}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' },
          }}
          onRowClick={(params) => openDetail(params.row)}
        />
      </Card>

      <VehicleFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditVehicle(null);
        }}
        onSubmit={handleCreateOrUpdate}
        vehicle={editVehicle}
        isLoading={creating || updating}
      />

      <VehicleDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        vehicle={detailVehicle}
        onEdit={() => {
          setEditVehicle(detailVehicle);
          setFormOpen(true);
        }}
        onAssign={() => {
          setAssignVehicleId(detailVehicle._id);
          setAssignOpen(true);
        }}
        onUnassign={async () => {
          try {
            const result = await unassignDriver(detailVehicle._id).unwrap();
            setDetailVehicle(result.data.vehicle);
            enqueueSnackbar('Driver unassigned', { variant: 'success' });
          } catch (err) {
            enqueueSnackbar(err?.data?.message || 'Failed', { variant: 'error' });
          }
        }}
        onDelete={() => setDeleteConfirm(detailVehicle)}
        onUploadImage={async (file) => {
          try {
            const result = await uploadImage({ vehicleId: detailVehicle._id, file }).unwrap();
            setDetailVehicle(result.data.vehicle);
            enqueueSnackbar('Image uploaded', { variant: 'success' });
          } catch (err) {
            enqueueSnackbar(err?.data?.message || 'Upload failed', { variant: 'error' });
          }
        }}
        onDeleteImage={async (publicId) => {
          try {
            const result = await deleteImage({ vehicleId: detailVehicle._id, publicId }).unwrap();
            setDetailVehicle(result.data.vehicle);
            enqueueSnackbar('Image removed', { variant: 'success' });
          } catch (err) {
            enqueueSnackbar(err?.data?.message || 'Failed', { variant: 'error' });
          }
        }}
        canUpdate={hasPermission(PERMISSIONS.UPDATE_VEHICLES)}
        canDelete={hasPermission(PERMISSIONS.DELETE_VEHICLES)}
        canAssign={hasPermission(PERMISSIONS.ASSIGN_VEHICLES)}
        canScheduleMaintenance={hasPermission(PERMISSIONS.MANAGE_MAINTENANCE)}
        onScheduleMaintenance={() => {
          setScheduleVehicleId(detailVehicle._id);
          setMaintenanceFormOpen(true);
        }}
        isUploading={uploading}
      />

      <MaintenanceFormDialog
        open={maintenanceFormOpen}
        onClose={() => {
          setMaintenanceFormOpen(false);
          setScheduleVehicleId(null);
        }}
        onSubmit={async (payload) => {
          try {
            await createMaintenance(payload).unwrap();
            enqueueSnackbar('Maintenance scheduled', { variant: 'success' });
            setMaintenanceFormOpen(false);
            setScheduleVehicleId(null);
          } catch (err) {
            enqueueSnackbar(err?.data?.message || 'Failed to schedule maintenance', { variant: 'error' });
          }
        }}
        isLoading={schedulingMaintenance}
        vehicles={maintenanceVehiclesData?.data || []}
        mechanics={maintenanceMechanicsData?.data || []}
        presetVehicleId={scheduleVehicleId}
      />

      <AssignDriverDialog
        open={assignOpen}
        onClose={() => {
          setAssignOpen(false);
          setAssignVehicleId(null);
        }}
        drivers={driversData?.data || []}
        currentDriverId={detailVehicle?.assignedDriver?._id}
        onAssign={async (driverId) => {
          try {
            const result = await assignDriver({ vehicleId: assignVehicleId, driverId }).unwrap();
            if (detailVehicle?._id === assignVehicleId) {
              setDetailVehicle(result.data.vehicle);
            }
            enqueueSnackbar('Driver assigned', { variant: 'success' });
          } catch (err) {
            enqueueSnackbar(err?.data?.message || 'Assignment failed', { variant: 'error' });
          }
        }}
      />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Vehicle</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete vehicle <strong>{deleteConfirm?.vehicleNumber}</strong>? This action
            cannot be undone.
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

export default VehiclesPage;
