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
  Badge,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WarningIcon from '@mui/icons-material/Warning';
import { useSnackbar } from 'notistack';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants';
import {
  useGetAlertStatsQuery,
  useGetAlertAnalyticsQuery,
  useGetAlertsQuery,
  useGetNotificationStatsQuery,
  useGetNotificationsQuery,
  useGetAlertMetaVehiclesQuery,
  useGetAlertMetaDriversQuery,
  useCreateAlertMutation,
  useMarkAlertAsReadMutation,
  useMarkAllAlertsAsReadMutation,
  useDeleteAlertMutation,
  useSyncAlertsMutation,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useExportAlertsMutation,
} from '../../redux/api/alertsApi';
import AlertFormDialog from '../../features/alerts/components/AlertFormDialog';
import AlertDetailDrawer from '../../features/alerts/components/AlertDetailDrawer';
import AlertAnalyticsPanel from '../../features/alerts/components/AlertAnalyticsPanel';
import {
  ALERT_TYPES,
  ALERT_SEVERITY,
  alertTypeLabels,
  severityColors,
  severityLabels,
  notificationTypeLabels,
} from '../../features/alerts/utils/alertUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';
import { formatRelativeTime } from '../../utils/formatters';

const AlertsPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.MANAGE_ALERTS);
  const canView = hasPermission(PERMISSIONS.VIEW_ALERTS);

  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [detailAlert, setDetailAlert] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      search: search || undefined,
      type: typeFilter || undefined,
      severity: severityFilter || undefined,
      isRead: readFilter === 'read' ? 'true' : readFilter === 'unread' ? 'false' : undefined,
      sort: 'createdAt:desc',
    }),
    [page, pageSize, search, typeFilter, severityFilter, readFilter]
  );

  const { data: statsData } = useGetAlertStatsQuery();
  const { data: notifStatsData } = useGetNotificationStatsQuery();
  const { data: analyticsData, isLoading: analyticsLoading } = useGetAlertAnalyticsQuery({ days: 30 }, { skip: tab !== 2 });
  const { data, isLoading, isError, error, refetch, isFetching } = useGetAlertsQuery(queryParams, { skip: tab !== 0 });
  const { data: notifData, refetch: refetchNotif, isFetching: notifFetching } = useGetNotificationsQuery(
    { page: 1, limit: 50, sort: 'createdAt:desc' },
    { skip: tab !== 1 }
  );
  const { data: vehiclesData } = useGetAlertMetaVehiclesQuery(undefined, { skip: !formOpen });
  const { data: driversData } = useGetAlertMetaDriversQuery(undefined, { skip: !formOpen });

  const [createAlert, { isLoading: creating }] = useCreateAlertMutation();
  const [markAlertAsRead] = useMarkAlertAsReadMutation();
  const [markAllAlertsAsRead] = useMarkAllAlertsAsReadMutation();
  const [deleteAlert] = useDeleteAlertMutation();
  const [syncAlerts, { isLoading: syncing }] = useSyncAlertsMutation();
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [markAllNotificationsAsRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [exportAlerts] = useExportAlertsMutation();

  const stats = statsData?.data;
  const notifStats = notifStatsData?.data;
  const alerts = data?.data?.alerts || [];
  const pagination = data?.data?.pagination || {};
  const notifications = notifData?.data?.notifications || [];

  const handleCreate = async (payload) => {
    try {
      await createAlert(payload).unwrap();
      enqueueSnackbar('Alert created', { variant: 'success' });
      setFormOpen(false);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Create failed', { variant: 'error' });
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const result = await markAlertAsRead(id).unwrap();
      enqueueSnackbar('Alert marked as read', { variant: 'success' });
      if (detailAlert?.id === id) setDetailAlert(result.data.alert);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsAsRead().unwrap();
      enqueueSnackbar('All alerts marked as read', { variant: 'success' });
    } catch {
      enqueueSnackbar('Operation failed', { variant: 'error' });
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncAlerts().unwrap();
      enqueueSnackbar(`Sync complete — ${result.data.synced} alert(s) generated`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Sync failed', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteAlert(deleteConfirm).unwrap();
      enqueueSnackbar('Alert deleted', { variant: 'success' });
      setDeleteConfirm(null);
      if (detailAlert?.id === deleteConfirm) {
        setDetailOpen(false);
        setDetailAlert(null);
      }
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Delete failed', { variant: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportAlerts({ type: typeFilter || undefined, severity: severityFilter || undefined }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alerts-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      enqueueSnackbar('Export failed', { variant: 'error' });
    }
  };

  const handleNotifRead = async (id) => {
    try {
      await markNotificationAsRead(id).unwrap();
    } catch {
      enqueueSnackbar('Operation failed', { variant: 'error' });
    }
  };

  const handleNotifDelete = async (id) => {
    try {
      await deleteNotification(id).unwrap();
      enqueueSnackbar('Notification removed', { variant: 'success' });
    } catch {
      enqueueSnackbar('Delete failed', { variant: 'error' });
    }
  };

  const columns = useMemo(
    () => [
      {
        field: 'severity',
        headerName: 'Severity',
        width: 100,
        renderCell: ({ value }) => (
          <Chip label={severityLabels[value] || value} size="small" color={severityColors[value] || 'default'} />
        ),
      },
      { field: 'title', headerName: 'Title', flex: 1, minWidth: 160 },
      {
        field: 'type',
        headerName: 'Type',
        width: 140,
        valueGetter: (value) => alertTypeLabels[value] || value,
      },
      {
        field: 'vehicle',
        headerName: 'Vehicle',
        width: 100,
        valueGetter: (value) => value?.vehicleNumber || '—',
      },
      {
        field: 'isRead',
        headerName: 'Status',
        width: 90,
        renderCell: ({ value }) => (
          <Chip label={value ? 'Read' : 'Unread'} size="small" color={value ? 'default' : 'warning'} variant="outlined" />
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Time',
        width: 130,
        valueFormatter: (value) => formatRelativeTime(value),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: canManage ? 100 : 60,
        sortable: false,
        renderCell: ({ row }) => (
          <Box>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={() => {
                  setDetailAlert(row);
                  setDetailOpen(true);
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canManage && (
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
    [canManage]
  );

  if (isError && tab === 0) {
    return <ErrorState title="Failed to load alerts" message={error?.data?.message} onRetry={refetch} />;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight={700}>
          Alerts & Notifications
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={tab === 1 ? refetchNotif : refetch} disabled={isFetching || notifFetching}>
            Refresh
          </Button>
          {canManage && (
            <Button startIcon={<SyncIcon />} variant="outlined" onClick={handleSync} disabled={syncing}>
              Sync Alerts
            </Button>
          )}
          {tab === 0 && (
            <>
              <Button startIcon={<DoneAllIcon />} variant="outlined" onClick={handleMarkAllRead}>
                Mark All Read
              </Button>
              <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExport}>
                Export
              </Button>
            </>
          )}
          {tab === 1 && (
            <Button
              startIcon={<DoneAllIcon />}
              variant="outlined"
              onClick={async () => {
                try {
                  await markAllNotificationsAsRead().unwrap();
                  enqueueSnackbar('All notifications marked as read', { variant: 'success' });
                } catch {
                  enqueueSnackbar('Operation failed', { variant: 'error' });
                }
              }}
            >
              Mark All Read
            </Button>
          )}
          {canManage && tab === 0 && (
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setFormOpen(true)}>
              Create Alert
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Alerts" value={stats?.total ?? 0} icon={<WarningIcon />} color="#D32F2F" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Unread Alerts" value={stats?.unread ?? 0} icon={<NotificationsActiveIcon />} color="#ED6C02" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Critical" value={stats?.critical ?? 0} icon={<WarningIcon />} color="#B71C1C" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="My Notifications" value={notifStats?.unread ?? 0} icon={<NotificationsActiveIcon />} color="#1565C0" />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`All Alerts (${stats?.unread ?? 0} unread)`} />
        <Tab
          label={
            <Badge badgeContent={notifStats?.unread ?? 0} color="error" max={99}>
              My Notifications
            </Badge>
          }
        />
        <Tab label="Analytics" />
      </Tabs>

      {tab === 0 && (
        <>
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search alerts..."
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
            <TextField size="small" select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="">All</MenuItem>
              {Object.values(ALERT_TYPES).map((t) => (
                <MenuItem key={t} value={t}>
                  {alertTypeLabels[t]}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select label="Severity" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} sx={{ minWidth: 130 }}>
              <MenuItem value="">All</MenuItem>
              {Object.values(ALERT_SEVERITY).map((s) => (
                <MenuItem key={s} value={s}>
                  {severityLabels[s]}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select label="Read Status" value={readFilter} onChange={(e) => setReadFilter(e.target.value)} sx={{ minWidth: 130 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
              <MenuItem value="read">Read</MenuItem>
            </TextField>
            <Button variant="outlined" onClick={() => setSearch(searchInput)}>
              Search
            </Button>
          </Box>
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={alerts}
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
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                '& .MuiDataGrid-row': {
                  opacity: 1,
                },
              }}
              getRowClassName={(params) => (!params.row.isRead ? 'alert-unread' : '')}
            />
          </Box>
        </>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              My Notifications
            </Typography>
            {notifications.length === 0 ? (
              <Typography color="text.secondary">No notifications</Typography>
            ) : (
              <List>
                {notifications.map((notif) => (
                  <ListItem
                    key={notif.id}
                    sx={{ opacity: notif.isRead ? 0.7 : 1 }}
                    secondaryAction={
                      <Box display="flex" gap={0.5}>
                        {!notif.isRead && (
                          <Button size="small" onClick={() => handleNotifRead(notif.id)}>
                            Read
                          </Button>
                        )}
                        <Button size="small" color="error" onClick={() => handleNotifDelete(notif.id)}>
                          Dismiss
                        </Button>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {notif.title}
                          <Chip label={notificationTypeLabels[notif.type] || notif.type} size="small" variant="outlined" />
                          {!notif.isRead && <Chip label="New" size="small" color="warning" />}
                        </Box>
                      }
                      secondary={`${notif.message} · ${formatRelativeTime(notif.createdAt)}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 2 && <AlertAnalyticsPanel analytics={analyticsData?.data} isLoading={analyticsLoading} />}

      <AlertFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        isLoading={creating}
        vehicles={vehiclesData?.data || []}
        drivers={driversData?.data || []}
      />

      <AlertDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailAlert(null); }}
        alert={detailAlert}
        onMarkRead={handleMarkRead}
        onDelete={setDeleteConfirm}
        canManage={canManage}
        canView={canView}
      />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Alert</DialogTitle>
        <DialogContent>
          <DialogContentText>This alert and its linked notifications will be permanently removed.</DialogContentText>
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

export default AlertsPage;
