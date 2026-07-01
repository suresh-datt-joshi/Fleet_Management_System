import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from './contexts/ThemeContext';
import { GoogleMapsProvider } from './contexts/GoogleMapsProvider';
import { store } from './redux/store';
import AuthInitializer from './components/common/AuthInitializer';
import ProtectedRoute from './components/common/ProtectedRoute';
import GuestRoute from './components/common/GuestRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OtpVerificationPage from './pages/auth/OtpVerificationPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import PermissionRoute from './components/common/PermissionRoute';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/vehicles/VehiclesPage';
import DriversPage from './pages/drivers/DriversPage';
import MechanicsPage from './pages/mechanics/MechanicsPage';
import TrackingPage from './pages/tracking/TrackingPage';
import RoutesPage from './pages/routes/RoutesPage';
import FuelPage from './pages/fuel/FuelPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import DocumentsPage from './pages/documents/DocumentsPage';
import TripsPage from './pages/trips/TripsPage';
import LiveTripUpdatesPage from './pages/live-trips/LiveTripUpdatesPage';
import TripReviewPage from './pages/trip-review/TripReviewPage';
import AlertsPage from './pages/alerts/AlertsPage';
import ReportsPage from './pages/reports/ReportsPage';
import AdminPage from './pages/admin/AdminPage';
import ProfilePage from './pages/profile/ProfilePage';
import MapsPage from './pages/maps/MapsPage';
import { PERMISSIONS } from './constants';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <GoogleMapsProvider>
          <SnackbarProvider maxSnack={3} autoHideDuration={4000} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <BrowserRouter>
            <AuthInitializer>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                <Route element={<AuthLayout />}>
                  <Route
                    path="/login"
                    element={
                      <GuestRoute>
                        <LoginPage />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <GuestRoute>
                        <RegisterPage />
                      </GuestRoute>
                    }
                  />
                  <Route path="/verify-otp" element={<OtpVerificationPage />} />
                  <Route
                    path="/forgot-password"
                    element={
                      <GuestRoute>
                        <ForgotPasswordPage />
                      </GuestRoute>
                    }
                  />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route
                    path="/vehicles"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_VEHICLES}>
                        <VehiclesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/drivers"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_DRIVERS}>
                        <DriversPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/mechanics"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_MECHANICS}>
                        <MechanicsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/tracking"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_TRACKING}>
                        <TrackingPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/routes"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_TRIPS}>
                        <RoutesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/fuel"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_FUEL}>
                        <FuelPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/maintenance"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_MAINTENANCE}>
                        <MaintenancePage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/documents"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_DOCUMENTS}>
                        <DocumentsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/live-trips"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_TRIPS}>
                        <LiveTripUpdatesPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/trip-review"
                    element={
                      <PermissionRoute permission={PERMISSIONS.REVIEW_TRIPS}>
                        <TripReviewPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/trips"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_TRIPS}>
                        <TripsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/alerts"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_ALERTS}>
                        <AlertsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_REPORTS}>
                        <ReportsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/maps"
                    element={
                      <PermissionRoute permission={PERMISSIONS.VIEW_TRACKING}>
                        <MapsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <PermissionRoute
                        anyPermission={[
                          PERMISSIONS.VIEW_ADMIN_PANEL,
                          PERMISSIONS.MANAGE_USERS,
                          PERMISSIONS.MANAGE_SETTINGS,
                        ]}
                      >
                        <AdminPage />
                      </PermissionRoute>
                    }
                  />
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AuthInitializer>
          </BrowserRouter>
          </SnackbarProvider>
        </GoogleMapsProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
