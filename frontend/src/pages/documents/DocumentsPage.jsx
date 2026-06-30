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
import DescriptionIcon from '@mui/icons-material/Description';
import WarningIcon from '@mui/icons-material/Warning';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS, DOCUMENT_TYPES } from '../../constants';
import {
  useGetDocumentStatsQuery,
  useGetDocumentAnalyticsQuery,
  useGetExpiringDocumentsQuery,
  useGetDocumentsQuery,
  useGetDocumentMetaVehiclesQuery,
  useGetDocumentMetaDriversQuery,
  useUploadDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
  useExportDocumentsMutation,
  useLazyGetDocumentDownloadQuery,
  resolveFileUrl,
} from '../../redux/api/documentsApi';
import DocumentUploadDialog from '../../features/documents/components/DocumentUploadDialog';
import DocumentDetailDrawer from '../../features/documents/components/DocumentDetailDrawer';
import DocumentAnalyticsPanel from '../../features/documents/components/DocumentAnalyticsPanel';
import {
  documentTypeLabels,
  statusColors,
  formatFileSize,
  formatDaysUntilExpiry,
} from '../../features/documents/utils/documentUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';

const DocumentsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.MANAGE_DOCUMENTS);

  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [detailDoc, setDetailDoc] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      search: search || undefined,
      type: typeFilter || undefined,
      status: statusFilter || undefined,
      sort: 'expiryDate:asc',
    }),
    [page, pageSize, search, typeFilter, statusFilter]
  );

  const { data: statsData } = useGetDocumentStatsQuery();
  const { data: analyticsData, isLoading: analyticsLoading } = useGetDocumentAnalyticsQuery(undefined, { skip: tab !== 2 });
  const { data: expiringData } = useGetExpiringDocumentsQuery({ days: 30, limit: 20 }, { skip: tab !== 1 });
  const { data, isLoading, isError, error, refetch, isFetching } = useGetDocumentsQuery(queryParams, { skip: tab !== 0 });
  const { data: vehiclesData } = useGetDocumentMetaVehiclesQuery(undefined, { skip: !uploadOpen });
  const { data: driversData } = useGetDocumentMetaDriversQuery(undefined, { skip: !uploadOpen });

  const [uploadDocument, { isLoading: uploading }] = useUploadDocumentMutation();
  const [updateDocument, { isLoading: updating }] = useUpdateDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [exportDocuments] = useExportDocumentsMutation();
  const [fetchDownload] = useLazyGetDocumentDownloadQuery();

  const stats = statsData?.data;
  const documents = data?.data?.documents || [];
  const pagination = data?.data?.pagination || {};
  const expiring = expiringData?.data || [];

  const handleSubmit = async (payload) => {
    try {
      const { file, id, entityType, vehicleId, driverId, issueDate, expiryDate, ...rest } = payload;
      const body = {
        ...rest,
        entityType,
        vehicleId: entityType === 'vehicle' ? vehicleId : undefined,
        driverId: entityType === 'driver' ? driverId : undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
      };

      if (id) {
        await updateDocument({ id, ...body }).unwrap();
        enqueueSnackbar('Document updated', { variant: 'success' });
      } else {
        await uploadDocument({ file, ...body }).unwrap();
        enqueueSnackbar('Document uploaded', { variant: 'success' });
      }
      setUploadOpen(false);
      setEditDoc(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleDownload = async (doc) => {
    try {
      const result = await fetchDownload(doc.id).unwrap();
      const url = resolveFileUrl(result.data.downloadUrl);
      window.open(url, '_blank');
    } catch {
      window.open(resolveFileUrl(doc.fileUrl), '_blank');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDocument(deleteConfirm).unwrap();
      enqueueSnackbar('Document deleted', { variant: 'success' });
      setDeleteConfirm(null);
      if (detailDoc?.id === deleteConfirm) {
        setDetailOpen(false);
        setDetailDoc(null);
      }
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Delete failed', { variant: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportDocuments({ type: typeFilter || undefined, status: statusFilter || undefined }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  const columns = useMemo(
    () => [
      { field: 'documentNumber', headerName: 'Doc #', width: 130 },
      { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
      {
        field: 'type',
        headerName: 'Type',
        width: 130,
        valueGetter: (value) => documentTypeLabels[value] || value,
      },
      {
        field: 'entityType',
        headerName: 'Linked',
        width: 90,
        valueGetter: (value) => value?.charAt(0).toUpperCase() + value?.slice(1),
      },
      {
        field: 'vehicle',
        headerName: 'Vehicle',
        width: 100,
        valueGetter: (value, row) => row.vehicle?.vehicleNumber || row.driver?.name || '—',
      },
      {
        field: 'expiryDate',
        headerName: 'Expiry',
        width: 120,
        valueFormatter: (value) => (value ? format(new Date(value), 'MMM d, yyyy') : '—'),
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
        field: 'fileSize',
        headerName: 'Size',
        width: 90,
        valueFormatter: (value) => formatFileSize(value),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: canManage ? 120 : 60,
        sortable: false,
        renderCell: ({ row }) => (
          <Box>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => {
                  setDetailDoc(row);
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
                      setEditDoc(row);
                      setUploadOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => setDeleteConfirm(row.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        ),
      },
    ],
    [canManage]
  );

  if (isError && tab === 0) {
    return <ErrorState title="Failed to load documents" message={error?.data?.message} onRetry={refetch} />;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight={700}>
          Document Management
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
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setEditDoc(null); setUploadOpen(true); }}>
              Upload Document
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Documents" value={stats?.total ?? 0} icon={<DescriptionIcon />} color="#1565C0" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Active" value={stats?.active ?? 0} icon={<DescriptionIcon />} color="#2E7D32" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Expiring Soon" value={stats?.expiringSoon ?? 0} icon={<WarningIcon />} color="#ED6C02" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Expired" value={stats?.expired ?? 0} icon={<WarningIcon />} color="#D32F2F" />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="All Documents" />
        <Tab label={`Expiring (${stats?.expiringSoon ?? 0})`} />
        <Tab label="Analytics" />
      </Tabs>

      {tab === 0 && (
        <>
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search documents..."
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
            <TextField size="small" select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="">All</MenuItem>
              {Object.values(DOCUMENT_TYPES).map((t) => (
                <MenuItem key={t} value={t}>
                  {documentTypeLabels[t]}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expiring_soon">Expiring Soon</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </TextField>
            <Button variant="outlined" onClick={() => setSearch(searchInput)}>
              Search
            </Button>
          </Box>
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={documents}
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
              Expiring & Expired Documents (30 days)
            </Typography>
            {expiring.length === 0 ? (
              <Typography color="text.secondary">No documents expiring in the next 30 days</Typography>
            ) : (
              <List>
                {expiring.map((doc) => (
                  <ListItem
                    key={doc.id}
                    secondaryAction={
                      <Button
                        size="small"
                        onClick={() => {
                          setDetailDoc(doc);
                          setDetailOpen(true);
                        }}
                      >
                        View
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {doc.title}
                          <Chip label={doc.status.replace('_', ' ')} size="small" color={statusColors[doc.status] || 'default'} />
                        </Box>
                      }
                      secondary={`${documentTypeLabels[doc.type]} · ${formatDaysUntilExpiry(doc.daysUntilExpiry)} · ${doc.vehicle?.vehicleNumber || doc.driver?.name || 'Fleet'}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 2 && <DocumentAnalyticsPanel analytics={analyticsData?.data} isLoading={analyticsLoading} />}

      <DocumentUploadDialog
        open={uploadOpen}
        onClose={() => { setUploadOpen(false); setEditDoc(null); }}
        onSubmit={handleSubmit}
        initialData={editDoc}
        isLoading={uploading || updating}
        vehicles={vehiclesData?.data || []}
        drivers={driversData?.data || []}
        isEdit={Boolean(editDoc?.id)}
      />

      <DocumentDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailDoc(null); }}
        document={detailDoc}
        onEdit={(d) => { setEditDoc(d); setUploadOpen(true); }}
        onDelete={setDeleteConfirm}
        onDownload={handleDownload}
        canManage={canManage}
      />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>The document and its file will be permanently removed.</DialogContentText>
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

export default DocumentsPage;
