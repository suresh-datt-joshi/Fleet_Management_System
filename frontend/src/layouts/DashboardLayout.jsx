import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Breadcrumbs,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PeopleIcon from '@mui/icons-material/People';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import RouteIcon from '@mui/icons-material/Route';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CommuteIcon from '@mui/icons-material/Commute';
import UpdateIcon from '@mui/icons-material/Update';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useThemeMode } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { useLogoutMutation } from '../redux/api/authApi';
import { ROLE_LABELS, PERMISSIONS, USER_ROLES } from '../constants';
import { usePermissions } from '../hooks/usePermissions';
import RealtimeSync from '../components/common/RealtimeSync';
import ConnectionStatusChip from '../components/common/ConnectionStatusChip';

const DRAWER_WIDTH = 260;

const allNavItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Vehicles', path: '/vehicles', icon: <LocalShippingIcon />, permission: PERMISSIONS.VIEW_VEHICLES },
  { label: 'Drivers', path: '/drivers', icon: <PeopleIcon />, permission: PERMISSIONS.VIEW_DRIVERS },
  { label: 'Tracking', path: '/tracking', icon: <GpsFixedIcon />, permission: PERMISSIONS.VIEW_TRACKING },
  { label: 'Routes', path: '/routes', icon: <RouteIcon />, permission: PERMISSIONS.VIEW_TRIPS },
  { label: 'Trips', path: '/trips', icon: <CommuteIcon />, permission: PERMISSIONS.VIEW_TRIPS },
  { label: 'Trip Review', path: '/trip-review', icon: <RateReviewIcon />, permission: PERMISSIONS.REVIEW_TRIPS },
  { label: 'Live Trip Updates', path: '/live-trips', icon: <UpdateIcon />, role: USER_ROLES.DRIVER },
  { label: 'Alerts', path: '/alerts', icon: <NotificationsActiveIcon />, permission: PERMISSIONS.VIEW_ALERTS },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon />, permission: PERMISSIONS.VIEW_REPORTS },
  { label: 'Admin', path: '/admin', icon: <AdminPanelSettingsIcon />, anyPermission: [PERMISSIONS.VIEW_ADMIN_PANEL, PERMISSIONS.MANAGE_USERS, PERMISSIONS.MANAGE_SETTINGS] },
  { label: 'Fuel', path: '/fuel', icon: <LocalGasStationIcon />, permission: PERMISSIONS.VIEW_FUEL },
  { label: 'Maintenance', path: '/maintenance', icon: <BuildIcon />, permission: PERMISSIONS.VIEW_MAINTENANCE },
  { label: 'Documents', path: '/documents', icon: <DescriptionIcon />, permission: PERMISSIONS.VIEW_DOCUMENTS },
];

const DashboardLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { mode, toggleTheme } = useThemeMode();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, hasRole } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [logout] = useLogoutMutation();

  const navItems = allNavItems.filter((item) => {
    if (item.role && !hasRole(item.role)) return false;
    if (item.anyPermission) return hasAnyPermission(...item.anyPermission);
    return !item.permission || hasPermission(item.permission);
  });

  const currentNav = navItems.find((item) => location.pathname.startsWith(item.path));
  const pageTitle =
    location.pathname === '/profile' ? 'Profile' : currentNav?.label || 'Dashboard';

  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <LocalShippingIcon />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            FleetOps
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Management System
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 2, flex: 1, overflow: 'auto' }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Divider />
      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          selected={location.pathname === '/profile'}
          onClick={() => {
            navigate('/profile');
            setMobileOpen(false);
          }}
          sx={{
            borderRadius: 2,
            py: 1.25,
            bgcolor: location.pathname === '/profile' ? 'action.selected' : 'transparent',
          }}
        >
          <ListItemIcon sx={{ minWidth: 44 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
              {userInitials}
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Profile'}
            secondary={ROLE_LABELS[user?.role] || user?.role}
            primaryTypographyProps={{ fontWeight: 600, noWrap: true }}
            secondaryTypographyProps={{ noWrap: true }}
          />
          <PersonOutlineIcon fontSize="small" color="action" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <RealtimeSync />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ flex: 1 }}>
            <Link underline="hover" color="inherit" href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
              Home
            </Link>
            <Typography color="text.primary">{pageTitle}</Typography>
          </Breadcrumbs>
          <ConnectionStatusChip />
          <IconButton onClick={toggleTheme} sx={{ mr: 1 }}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">{user?.fullName || `${user?.firstName} ${user?.lastName}`}</Typography>
              <Typography variant="caption" color="text.secondary">
                {ROLE_LABELS[user?.role] || user?.role}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                navigate('/profile');
              }}
            >
              <ListItemIcon>
                <PersonOutlineIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
