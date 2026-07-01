import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { baseApi } from './api/baseApi';
import './api/authApi';
import './api/dashboardApi';
import './api/vehiclesApi';
import './api/driversApi';
import './api/mechanicsApi';
import './api/trackingApi';
import './api/routesApi';
import './api/fuelApi';
import './api/maintenanceApi';
import './api/documentsApi';
import './api/tripsApi';
import './api/alertsApi';
import './api/reportsApi';
import './api/adminApi';
import './api/mapsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export default store;
