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
import BuildIcon from '@mui/icons-material/Build';
import { useSnackbar } from 'notistack';
import { usePermissions } from '../../hooks/usePermissions';
import {
  PERMISSIONS,
  MECHANIC_STATUS,
  MECHANIC_SPECIALIZATIONS,
  MECHANIC_SPECIALIZATION_LABELS,
} from '../../constants';
import {
  useGetMechanicsQuery,
  useGetMechanicStatsQuery,
  useCreateMechanicMutation,
  useUpdateMechanicMutation,
  useDeleteMechanicMutation,
  useUploadMechanicAvatarMutation,
  useUploadMechanicDocumentMutation,
  useDeleteMechanicDocumentMutation,
  useExportMechanicsMutation,
} from '../../redux/api/mechanicsApi';
import MechanicFormDialog from '../../features/mechanics/components/MechanicFormDialog';
import MechanicDetailDrawer from '../../features/mechanics/components/MechanicDetailDrawer';
import { statusColors } from '../../features/mechanics/utils/mechanicUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';

const MechanicsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editMechanic, setEditMechanic] = useState(null);
  const [detailMechanic, setDetailMechanic] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
      specialization: specializationFilter || undefined,
      sort: 'createdAt:desc',
    }),
    [page, pageSize, search, statusFilter, specializationFilter]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useGetMechanicsQuery(queryParams);
  const { data: statsData } = useGetMechanicStatsQuery();

  const [createMechanic, { isLoading: creating }] = useCreateMechanicMutation();
  const [updateMechanic, { isLoading: updating }] = useUpdateMechanicMutation();
  const [deleteMechanic] = useDeleteMechanicMutation();
  const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadMechanicAvatarMutation();
  const [uploadDocument] = useUploadMechanicDocumentMutation();
  const [deleteDocument] = useDeleteMechanicDocumentMutation();
  const [exportMechanics] = useExportMechanicsMutation();

  const mechanics = data?.data?.mechanics || [];
  const pagination = data?.data?.pagination || {};
  const stats = statsData?.data;

  const openDetail = useCallback((mechanic) => {
    setDetailMechanic(mechanic);
    setDetailOpen(true);
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editMechanic) {
        const result = await updateMechanic({ id: editMechanic._id, ...formData }).unwrap();
        enqueueSnackbar('Mechanic updated successfully', { variant: 'success' });
        if (detailMechanic?._id === editMechanic._id) setDetailMechanic(result.data.mechanic);
      } else {
        await createMechanic(formData).unwrap();
        enqueueSnackbar('Mechanic created successfully', { variant: 'success' });
      }
      setFormOpen(false);
      setEditMechanic(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Mechanic',
        flex: 1,
        minWidth: 160,
        renderCell: (params) => {
          const name = `${params.row.firstName} ${params.row.lastName}`;
          const id = params.row.employeeId || params.row.certificationNumber;
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
      {
        field: 'specialization',
        headerName: 'Specialization',
        width: 130,
        valueGetter: (_, row) => MECHANIC_SPECIALIZATION_LABELS[row.specialization] || row.specialization,
      },
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
        field: 'user',
        headerName: 'Account',
        width: 100,
        valueGetter: (_, row) => (row.user ? 'Linked' : '—'),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        sortable: false,
        renderCell: (params) => (
          <Box>
            <Tooltip title="View"><IconButton size="small" onClick={() => openDetail(params.row)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
            {hasPermission(PERMISSIONS.UPDATE_MECHANICS) && (
              <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditMechanic(params.row); setFormOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [hasPermission, openDetail]
  );

  if (isError) return <ErrorState message={error?.data?.message || 'Failed to load mechanics'} onRetry={refetch} />;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Mechanic Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage mechanics, certifications, and work assignments</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh"><IconButton onClick={refetch} disabled={isFetching}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={async () => {
            try {
              const blob = await exportMechanics({ search, status: statusFilter, specialization: specializationFilter }).unwrap();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `mechanics-${Date.now()}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              enqueueSnackbar('Export downloaded', { variant: 'success' });
            } catch { enqueueSnackbar('Export failed', { variant: 'error' }); }
          }}>Export CSV</Button>
          {hasPermission(PERMISSIONS.CREATE_MECHANICS) && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditMechanic(null); setFormOpen(true); }}>Add Mechanic</Button>
          )}
        </Box>
      </Box>

      {stats && (
        <Grid container spacing={2} mb={3}>
          {[
            { title: 'Total Mechanics', value: stats.total, color: '#1565C0' },
            { title: 'Available', value: stats.available, color: '#2E7D32' },
            { title: 'On Job', value: stats.onJob, color: '#0288D1' },
            { title: 'Avg Score', value: `${stats.averagePerformanceScore}%`, color: '#7B1FA2' },
          ].map((s, i) => (
            <Grid item xs={6} sm={3} key={s.title}>
              <StatCard title={s.title} value={s.value} icon={<BuildIcon />} color={s.color} index={i} />
            </Grid>
          ))}
        </Grid>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Search name, email, certification..." value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (setSearch(searchInput), setPage(0))}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth select size="small" label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {Object.values(MECHANIC_STATUS).map((s) => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField fullWidth select size="small" label="Specialization" value={specializationFilter} onChange={(e) => { setSpecializationFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {Object.values(MECHANIC_SPECIALIZATIONS).map((s) => (
                  <MenuItem key={s} value={s}>{MECHANIC_SPECIALIZATION_LABELS[s] || s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" onClick={() => { setSearch(searchInput); setPage(0); }}>Search</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <DataGrid rows={mechanics} columns={columns} getRowId={(row) => row._id} loading={isLoading || isFetching}
          rowCount={pagination.total || 0} paginationMode="server" paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m) => { setPage(m.page); setPageSize(m.pageSize); }}
          pageSizeOptions={[5, 10, 25, 50]} disableRowSelectionOnClick autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: 'background.default' } }}
          onRowClick={(params) => openDetail(params.row)} />
      </Card>

      <MechanicFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditMechanic(null); }} onSubmit={handleCreateOrUpdate} mechanic={editMechanic} isLoading={creating || updating} />

      <MechanicDetailDrawer
        open={detailOpen} onClose={() => setDetailOpen(false)} mechanic={detailMechanic}
        onEdit={() => { setEditMechanic(detailMechanic); setFormOpen(true); }}
        onDelete={() => setDeleteConfirm(detailMechanic)}
        onUploadAvatar={async (file) => {
          try {
            const result = await uploadAvatar({ mechanicId: detailMechanic._id, file }).unwrap();
            setDetailMechanic(result.data.mechanic);
            enqueueSnackbar('Photo uploaded', { variant: 'success' });
          } catch (err) { enqueueSnackbar(err?.data?.message || 'Upload failed', { variant: 'error' }); }
        }}
        onUploadDocument={async ({ file, type, name, expiryDate }) => {
          try {
            const result = await uploadDocument({ mechanicId: detailMechanic._id, file, type, name, expiryDate }).unwrap();
            setDetailMechanic(result.data.mechanic);
            enqueueSnackbar('Document uploaded', { variant: 'success' });
          } catch (err) { enqueueSnackbar(err?.data?.message || 'Upload failed', { variant: 'error' }); }
        }}
        onDeleteDocument={async (documentId) => {
          try {
            const result = await deleteDocument({ mechanicId: detailMechanic._id, documentId }).unwrap();
            setDetailMechanic(result.data.mechanic);
            enqueueSnackbar('Document removed', { variant: 'success' });
          } catch (err) { enqueueSnackbar(err?.data?.message || 'Failed', { variant: 'error' }); }
        }}
        canUpdate={hasPermission(PERMISSIONS.UPDATE_MECHANICS)}
        canDelete={hasPermission(PERMISSIONS.DELETE_MECHANICS)}
        isUploading={uploadingAvatar}
      />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Mechanic</DialogTitle>
        <DialogContent>
          <DialogContentText>Delete <strong>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong>? This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            try {
              await deleteMechanic(deleteConfirm._id).unwrap();
              enqueueSnackbar('Mechanic deleted', { variant: 'success' });
              setDeleteConfirm(null); setDetailOpen(false); setDetailMechanic(null);
            } catch (err) { enqueueSnackbar(err?.data?.message || 'Delete failed', { variant: 'error' }); }
          }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MechanicsPage;
