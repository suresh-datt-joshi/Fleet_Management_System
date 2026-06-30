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
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
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
import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants';
import {
  useGetMaintenanceStatsQuery,
  useGetMaintenanceAnalyticsQuery,
  useGetUpcomingMaintenanceQuery,
  useGetMaintenanceRecordsQuery,
  useGetMaintenanceMetaVehiclesQuery,
  useGetMaintenanceMetaMechanicsQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
  useDeleteMaintenanceMutation,
  useAssignMechanicMutation,
  useStartMaintenanceMutation,
  useCompleteMaintenanceMutation,
  useExportMaintenanceMutation,
} from '../../redux/api/maintenanceApi';
import MaintenanceFormDialog from '../../features/maintenance/components/MaintenanceFormDialog';
import MaintenanceDetailDrawer from '../../features/maintenance/components/MaintenanceDetailDrawer';
import AssignMechanicDialog from '../../features/maintenance/components/AssignMechanicDialog';
import MaintenanceAnalyticsPanel from '../../features/maintenance/components/MaintenanceAnalyticsPanel';
import {
  MAINTENANCE_STATUS,
  MAINTENANCE_TYPE,
  statusColors,
  priorityColors,
  typeLabels,
  formatCurrency,
  canStart,
  canEdit,
  canDelete,
} from '../../features/maintenance/utils/maintenanceUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';

const MaintenancePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.MANAGE_MAINTENANCE);
  const canAssign = hasPermission(PERMISSIONS.ASSIGN_WORK_ORDERS);

  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignRecord, setAssignRecord] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      sort: 'scheduledDate:desc',
    }),
    [page, pageSize, search, statusFilter, typeFilter]
  );

  const { data: statsData } = useGetMaintenanceStatsQuery();
  const { data: analyticsData, isLoading: analyticsLoading } = useGetMaintenanceAnalyticsQuery({ months: 6 });
  const { data: upcomingData } = useGetUpcomingMaintenanceQuery({ days: 14, limit: 10 }, { skip: tab !== 1 });
  const { data, isLoading, isError, error, refetch, isFetching } = useGetMaintenanceRecordsQuery(queryParams, {
    skip: tab !== 0,
  });
  const { data: vehiclesData } = useGetMaintenanceMetaVehiclesQuery(undefined, { skip: !formOpen });
  const { data: mechanicsData } = useGetMaintenanceMetaMechanicsQuery(undefined, {
    skip: !formOpen && !assignOpen,
  });

  const [createRecord, { isLoading: creating }] = useCreateMaintenanceMutation();
  const [updateRecord, { isLoading: updating }] = useUpdateMaintenanceMutation();
  const [deleteRecord] = useDeleteMaintenanceMutation();
  const [assignMechanic, { isLoading: assigning }] = useAssignMechanicMutation();
  const [startMaintenance, { isLoading: starting }] = useStartMaintenanceMutation();
  const [completeMaintenance] = useCompleteMaintenanceMutation();
  const [exportMaintenance] = useExportMaintenanceMutation();

  const stats = statsData?.data;
  const records = data?.data?.records || [];
  const pagination = data?.data?.pagination || {};
  const upcoming = upcomingData?.data || [];

  const handleFormSubmit = async (payload) => {
    try {
      if (editRecord?.id) {
        await updateRecord({ id: editRecord.id, ...payload }).unwrap();
        enqueueSnackbar('Work order updated', { variant: 'success' });
      } else {
        await createRecord(payload).unwrap();
        enqueueSnackbar('Work order created', { variant: 'success' });
      }
      setFormOpen(false);
      setEditRecord(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleAssign = async ({ mechanicId }) => {
    if (!assignRecord) return;
    try {
      const result = await assignMechanic({ id: assignRecord.id, mechanicId }).unwrap();
      enqueueSnackbar('Mechanic assigned', { variant: 'success' });
      if (detailRecord?.id === assignRecord.id) setDetailRecord(result.data.record);
      setAssignOpen(false);
      setAssignRecord(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Assign failed', { variant: 'error' });
    }
  };

  const handleStart = useCallback(
    async (id) => {
      try {
        const result = await startMaintenance(id).unwrap();
        enqueueSnackbar('Work order started', { variant: 'success' });
        if (detailRecord?.id === id) setDetailRecord(result.data.record);
      } catch (err) {
        enqueueSnackbar(err?.data?.message || 'Start failed', { variant: 'error' });
      }
    },
    [startMaintenance, enqueueSnackbar, detailRecord]
  );

  const handleComplete = async (record) => {
    try {
      const result = await completeMaintenance({ id: record.id }).unwrap();
      enqueueSnackbar('Work order completed', { variant: 'success' });
      setDetailRecord(result.data.record);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Complete failed', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRecord(deleteConfirm).unwrap();
      enqueueSnackbar('Work order deleted', { variant: 'success' });
      setDeleteConfirm(null);
      if (detailRecord?.id === deleteConfirm) {
        setDetailOpen(false);
        setDetailRecord(null);
      }
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Delete failed', { variant: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportMaintenance({ status: statusFilter || undefined }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  const columns = useMemo(
    () => [
      { field: 'workOrderNumber', headerName: 'WO #', width: 130 },
      { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
      {
        field: 'vehicle',
        headerName: 'Vehicle',
        width: 110,
        valueGetter: (value) => value?.vehicleNumber || '—',
      },
      {
        field: 'type',
        headerName: 'Type',
        width: 110,
        valueGetter: (value) => typeLabels[value] || value,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: ({ value }) => (
          <Chip label={value.replace('_', ' ')} size="small" color={statusColors[value] || 'default'} sx={{ textTransform: 'capitalize' }} />
        ),
      },
      {
        field: 'priority',
        headerName: 'Priority',
        width: 100,
        renderCell: ({ value }) => (
          <Chip label={value} size="small" color={priorityColors[value] || 'default'} sx={{ textTransform: 'capitalize' }} />
        ),
      },
      {
        field: 'scheduledDate',
        headerName: 'Scheduled',
        width: 120,
        valueFormatter: (value) => (value ? format(new Date(value), 'MMM d, yyyy') : '—'),
      },
      {
        field: 'cost',
        headerName: 'Cost',
        width: 100,
        valueFormatter: (value) => formatCurrency(value),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 140,
        sortable: false,
        renderCell: ({ row }) => (
          <Box>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => {
                  setDetailRecord(row);
                  setDetailOpen(true);
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canManage && canEdit(row.status) && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditRecord(row);
                    setFormOpen(true);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canManage && canStart(row.status) && (
              <Tooltip title="Start">
                <IconButton size="small" color="primary" onClick={() => handleStart(row.id)} disabled={starting}>
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canManage && canDelete(row.status) && (
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
    [canManage, handleStart, starting]
  );

  if (isError && tab === 0) {
    return <ErrorState title="Failed to load maintenance" message={error?.data?.message} onRetry={refetch} />;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight={700}>
          Maintenance
        </Typography>
        <Box display="flex" gap={1}>
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={refetch} disabled={isFetching}>
            Refresh
          </Button>
          {tab === 0 && (
            <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExport}>
              Export
            </Button>
          )}
          {canManage && tab === 0 && (
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setEditRecord(null); setFormOpen(true); }}>
              Create Work Order
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Total" value={stats?.total ?? 0} icon={<BuildIcon />} color="#1565C0" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="In Progress" value={stats?.inProgress ?? 0} icon={<BuildIcon />} color="#ED6C02" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Overdue" value={stats?.overdue ?? 0} icon={<WarningIcon />} color="#D32F2F" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Due This Week" value={stats?.upcomingWeek ?? 0} icon={<BuildIcon />} color="#7B1FA2" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Completed" value={stats?.completed ?? 0} icon={<BuildIcon />} color="#2E7D32" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Avg Cost" value={formatCurrency(stats?.averageWorkOrderCost)} icon={<BuildIcon />} color="#00897B" />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Work Orders" />
        <Tab label="Upcoming" />
        <Tab label="Analytics" />
      </Tabs>

      {tab === 0 && (
        <>
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search work orders..."
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
            <TextField size="small" select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 130 }}>
              <MenuItem value="">All</MenuItem>
              {Object.values(MAINTENANCE_STATUS).map((s) => (
                <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                  {s.replace('_', ' ')}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 130 }}>
              <MenuItem value="">All</MenuItem>
              {Object.values(MAINTENANCE_TYPE).map((t) => (
                <MenuItem key={t} value={t}>
                  {typeLabels[t]}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" onClick={() => setSearch(searchInput)}>
              Search
            </Button>
          </Box>
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={records}
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
        </>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Upcoming & Overdue (14 days)
            </Typography>
            {upcoming.length === 0 ? (
              <Typography color="text.secondary">No upcoming maintenance scheduled</Typography>
            ) : (
              <List>
                {upcoming.map((item) => (
                  <ListItem
                    key={item.id}
                    secondaryAction={
                      <Button
                        size="small"
                        onClick={() => {
                          setDetailRecord(item);
                          setDetailOpen(true);
                        }}
                      >
                        View
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={`${item.workOrderNumber} — ${item.title}`}
                      secondary={`${item.vehicle?.vehicleNumber} · ${format(new Date(item.scheduledDate), 'MMM d, yyyy')} · ${item.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <MaintenanceAnalyticsPanel analytics={analyticsData?.data} isLoading={analyticsLoading} />
      )}

      <MaintenanceFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditRecord(null); }}
        onSubmit={handleFormSubmit}
        initialData={editRecord}
        isLoading={creating || updating}
        vehicles={vehiclesData?.data || []}
        mechanics={mechanicsData?.data || []}
      />

      <MaintenanceDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailRecord(null); }}
        record={detailRecord}
        onEdit={(r) => { setEditRecord(r); setFormOpen(true); }}
        onAssign={(r) => { setAssignRecord(r); setAssignOpen(true); }}
        onStart={handleStart}
        onComplete={handleComplete}
        canManage={canManage}
        canAssign={canAssign}
        loadingAction={starting}
      />

      <AssignMechanicDialog
        open={assignOpen}
        onClose={() => { setAssignOpen(false); setAssignRecord(null); }}
        onSubmit={handleAssign}
        mechanics={mechanicsData?.data || []}
        record={assignRecord}
        isLoading={assigning}
      />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Work Order</DialogTitle>
        <DialogContent>
          <DialogContentText>This work order will be permanently removed.</DialogContentText>
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

export default MaintenancePage;
