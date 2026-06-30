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
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../hooks/useAuth';
import { PERMISSIONS, USER_ROLES, ROLE_LABELS } from '../../constants';
import {
  useGetAdminStatsQuery,
  useGetRolesQuery,
  useGetUsersQuery,
  useGetSettingsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useUpdateSettingsMutation,
} from '../../redux/api/adminApi';
import UserFormDialog from '../../features/admin/components/UserFormDialog';
import SettingsForm from '../../features/admin/components/SettingsForm';
import RolesPanel, { AdminOverviewPanel } from '../../features/admin/components/RolesPanel';
import { roleColors } from '../../features/admin/utils/adminUtils';
import ErrorState from '../../components/common/ErrorState';
import StatCard from '../../features/dashboard/components/StatCard';

const AdminPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const canViewAdmin = hasPermission(PERMISSIONS.VIEW_ADMIN_PANEL);
  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS);
  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_SETTINGS);

  const tabs = useMemo(() => {
    const items = [];
    if (canViewAdmin) items.push({ key: 'overview', label: 'Overview' });
    if (canManageUsers) items.push({ key: 'users', label: 'Users' });
    if (canViewAdmin) items.push({ key: 'roles', label: 'Roles & Permissions' });
    if (canManageSettings) items.push({ key: 'settings', label: 'Settings' });
    return items;
  }, [canViewAdmin, canManageUsers, canManageSettings]);

  const [tab, setTab] = useState(tabs[0]?.key || 'settings');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const queryParams = useMemo(
    () => ({
      page: page + 1,
      limit: pageSize,
      search: search || undefined,
      role: roleFilter || undefined,
      sort: 'createdAt:desc',
    }),
    [page, pageSize, search, roleFilter]
  );

  const { data: statsData } = useGetAdminStatsQuery(undefined, { skip: !canViewAdmin });
  const { data: rolesData } = useGetRolesQuery(undefined, { skip: !canViewAdmin || tab !== 'roles' });
  const { data: settingsData } = useGetSettingsQuery(undefined, { skip: !canManageSettings });
  const { data, isLoading, isError, error, refetch, isFetching } = useGetUsersQuery(queryParams, {
    skip: !canManageUsers || tab !== 'users',
  });

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [resetPassword, { isLoading: resetting }] = useResetUserPasswordMutation();
  const [updateSettings, { isLoading: savingSettings }] = useUpdateSettingsMutation();

  const stats = statsData?.data;
  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || {};
  const settings = settingsData?.data?.settings;

  const handleFormSubmit = async (payload) => {
    try {
      if (editUser?.id) {
        await updateUser({ id: editUser.id, ...payload }).unwrap();
        enqueueSnackbar('User updated', { variant: 'success' });
      } else {
        await createUser(payload).unwrap();
        enqueueSnackbar('User created', { variant: 'success' });
      }
      setFormOpen(false);
      setEditUser(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Operation failed', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUser(deleteConfirm).unwrap();
      enqueueSnackbar('User deleted', { variant: 'success' });
      setDeleteConfirm(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Delete failed', { variant: 'error' });
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser || !newPassword) return;
    try {
      await resetPassword({ id: resetUser, password: newPassword }).unwrap();
      enqueueSnackbar('Password reset successfully', { variant: 'success' });
      setResetUser(null);
      setNewPassword('');
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Reset failed', { variant: 'error' });
    }
  };

  const handleSaveSettings = async (payload) => {
    try {
      await updateSettings({
        ...payload,
        fuelLowThreshold: Number(payload.fuelLowThreshold),
        maintenanceReminderDays: Number(payload.maintenanceReminderDays),
        documentReminderDays: Number(payload.documentReminderDays),
        speedLimitKmh: Number(payload.speedLimitKmh),
        gpsUpdateIntervalSeconds: Number(payload.gpsUpdateIntervalSeconds),
      }).unwrap();
      enqueueSnackbar('Settings saved', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Save failed', { variant: 'error' });
    }
  };

  const columns = useMemo(
    () => [
      {
        field: 'fullName',
        headerName: 'Name',
        flex: 1,
        minWidth: 140,
        valueGetter: (value, row) => value || `${row.firstName} ${row.lastName}`,
      },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
      {
        field: 'role',
        headerName: 'Role',
        width: 130,
        renderCell: ({ value }) => (
          <Chip label={ROLE_LABELS[value] || value} size="small" color={roleColors[value] || 'default'} />
        ),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 90,
        renderCell: ({ value }) => (
          <Chip label={value ? 'Active' : 'Inactive'} size="small" color={value ? 'success' : 'default'} variant="outlined" />
        ),
      },
      {
        field: 'lastLogin',
        headerName: 'Last Login',
        width: 130,
        valueFormatter: (value) => (value ? format(new Date(value), 'MMM d, yyyy') : 'Never'),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 120,
        sortable: false,
        renderCell: ({ row }) => (
          <Box display="flex">
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => { setEditUser(row); setFormOpen(true); }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Password">
              <IconButton size="small" onClick={() => setResetUser(row.id)}>
                <LockResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => setDeleteConfirm(row.id)} disabled={row.id === user?.id}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [user]
  );

  if (isError && tab === 'users') {
    return <ErrorState title="Failed to load users" message={error?.data?.message} onRetry={refetch} />;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight={700}>
          Admin Panel
        </Typography>
        {canManageUsers && tab === 'users' && (
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setEditUser(null); setFormOpen(true); }}>
            Create User
          </Button>
        )}
      </Box>

      {canViewAdmin && stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatCard title="Total Users" value={stats.users?.total ?? 0} icon={<PeopleIcon />} color="#1565C0" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Active Users" value={stats.users?.active ?? 0} icon={<PeopleIcon />} color="#2E7D32" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Vehicles" value={stats.fleet?.vehicles ?? 0} icon={<AdminPanelSettingsIcon />} color="#ED6C02" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Drivers" value={stats.fleet?.drivers ?? 0} icon={<PeopleIcon />} color="#7B1FA2" />
          </Grid>
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {tabs.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>

      {tab === 'overview' && <AdminOverviewPanel stats={stats} />}

      {tab === 'users' && canManageUsers && (
        <>
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search users..."
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
            <TextField size="small" select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="">All</MenuItem>
              {Object.values(USER_ROLES).map((r) => (
                <MenuItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" onClick={() => setSearch(searchInput)}>
              Search
            </Button>
            <Button startIcon={<RefreshIcon />} variant="outlined" onClick={refetch} disabled={isFetching}>
              Refresh
            </Button>
          </Box>
          <Box sx={{ height: 520 }}>
            <DataGrid
              rows={users}
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

      {tab === 'roles' && <RolesPanel roles={rolesData?.data || []} />}

      {tab === 'settings' && canManageSettings && (
        <SettingsForm settings={settings} onSubmit={handleSaveSettings} isLoading={savingSettings} />
      )}

      <UserFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditUser(null); }}
        onSubmit={handleFormSubmit}
        initialData={editUser}
        isLoading={creating || updating}
        actorRole={user?.role}
      />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>This user account will be deactivated and removed from the system.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(resetUser)} onClose={() => { setResetUser(null); setNewPassword(''); }}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 1 }}
            helperText="Min 8 chars, uppercase, lowercase, and number required"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setResetUser(null); setNewPassword(''); }}>Cancel</Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={resetting || !newPassword}>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;
