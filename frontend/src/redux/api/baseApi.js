import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../constants';
import { getAccessToken, setAccessToken } from '../../utils/tokenStorage';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await baseQuery(
      { url: '/auth/refresh-token', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data?.data?.accessToken) {
      setAccessToken(refreshResult.data.data.accessToken);
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'User', 'Dashboard', 'Vehicle', 'VehicleHistory', 'Driver', 'DriverHistory', 'Tracking', 'TrackingHistory', 'Geofence', 'Route', 'RouteHistory', 'Fuel', 'FuelLog', 'FuelStation', 'Maintenance', 'MaintenanceHistory', 'Document', 'Trip', 'TripHistory', 'TripExpense', 'Alert', 'Notification', 'Report', 'Admin', 'AdminUser', 'Maps'],
  endpoints: () => ({}),
});

export default baseApi;
