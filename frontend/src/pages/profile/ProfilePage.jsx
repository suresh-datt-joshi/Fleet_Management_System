import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VerifiedIcon from '@mui/icons-material/Verified';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useGetMeQuery, useChangePasswordMutation } from '../../redux/api/authApi';
import { ROLE_LABELS } from '../../constants';
import ErrorState from '../../components/common/ErrorState';
import LoadingScreen from '../../components/common/LoadingScreen';

const DetailItem = ({ label, value }) => (
  <Box py={1}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={500}>
      {value || '—'}
    </Typography>
  </Box>
);

const ProfilePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { data, isLoading, isError, refetch } = useGetMeQuery();
  const [changePassword, { isLoading: changingPassword }] = useChangePasswordMutation();

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const user = data?.data?.user;

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      enqueueSnackbar('New passwords do not match', { variant: 'warning' });
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();
      enqueueSnackbar('Password updated successfully', { variant: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      enqueueSnackbar(err?.data?.message || 'Failed to change password', { variant: 'error' });
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  if (isError || !user) {
    return <ErrorState message="Failed to load profile" onRetry={refetch} />;
  }

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 28 }}>
              {initials}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h4" fontWeight={700}>
                {user.fullName || `${user.firstName} ${user.lastName}`}
              </Typography>
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                <Chip label={ROLE_LABELS[user.role] || user.role} color="primary" size="small" />
                <Chip
                  icon={user.isEmailVerified ? <VerifiedIcon /> : undefined}
                  label={user.isEmailVerified ? 'Email verified' : 'Email not verified'}
                  color={user.isEmailVerified ? 'success' : 'warning'}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={user.isActive ? 'Active account' : 'Inactive account'}
                  color={user.isActive ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <DetailItem label="First name" value={user.firstName} />
              <DetailItem label="Last name" value={user.lastName} />
              <DetailItem label="Email" value={user.email} />
              <DetailItem label="Phone" value={user.phone} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                <BadgeIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Account Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <DetailItem label="User ID" value={user.id || user._id} />
              <DetailItem label="Role" value={ROLE_LABELS[user.role] || user.role} />
              <DetailItem
                label="Last login"
                value={user.lastLogin ? format(new Date(user.lastLogin), 'PPpp') : '—'}
              />
              <DetailItem
                label="Member since"
                value={user.createdAt ? format(new Date(user.createdAt), 'PPP') : '—'}
              />
              <DetailItem
                label="Last updated"
                value={user.updatedAt ? format(new Date(user.updatedAt), 'PPpp') : '—'}
              />
            </CardContent>
          </Card>
        </Grid>

        {user.linkedDriver && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                  Linked Driver Profile
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="Driver name" value={user.linkedDriver.name} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="Employee ID" value={user.linkedDriver.employeeId} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="License" value={user.linkedDriver.licenseNumber} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem label="Status" value={user.linkedDriver.status} />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="License expiry"
                      value={
                        user.linkedDriver.licenseExpiry
                          ? format(new Date(user.linkedDriver.licenseExpiry), 'PPP')
                          : '—'
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="Experience"
                      value={`${user.linkedDriver.experienceYears ?? 0} years`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="Performance score"
                      value={`${user.linkedDriver.performanceScore ?? '—'}/100`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DetailItem
                      label="Assigned vehicle"
                      value={
                        user.linkedDriver.assignedVehicle
                          ? `${user.linkedDriver.assignedVehicle.vehicleNumber} (${user.linkedDriver.assignedVehicle.manufacturer} ${user.linkedDriver.assignedVehicle.model})`
                          : 'None'
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Permissions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" gap={1} flexWrap="wrap">
                {(user.permissions || []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No permissions assigned
                  </Typography>
                ) : (
                  user.permissions.map((permission) => (
                    <Chip key={permission} label={permission.replace(/_/g, ' ')} size="small" variant="outlined" />
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                <LockIcon sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Change Password
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box component="form" onSubmit={handlePasswordChange}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Current password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  required
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="New password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  required
                  helperText="At least 8 characters with uppercase, lowercase, and a number"
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Confirm new password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Contact Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <EmailIcon color="action" fontSize="small" />
                <Typography variant="body2">{user.email}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <PhoneIcon color="action" fontSize="small" />
                <Typography variant="body2">{user.phone || 'No phone number on file'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
