import { baseApi } from './baseApi';
import axiosInstance from '../../services/axiosInstance';

export const maintenanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMaintenanceStats: builder.query({
      query: () => '/maintenance/stats',
      providesTags: [{ type: 'Maintenance', id: 'STATS' }],
    }),
    getMaintenanceAnalytics: builder.query({
      query: (params) => ({
        url: '/maintenance/analytics',
        params,
      }),
      providesTags: [{ type: 'Maintenance', id: 'ANALYTICS' }],
    }),
    getUpcomingMaintenance: builder.query({
      query: (params) => ({
        url: '/maintenance/upcoming',
        params,
      }),
      providesTags: [{ type: 'Maintenance', id: 'UPCOMING' }],
    }),
    getMaintenanceRecords: builder.query({
      query: (params) => ({
        url: '/maintenance',
        params,
      }),
      providesTags: (result) =>
        result?.data?.records
          ? [
              ...result.data.records.map(({ id }) => ({ type: 'Maintenance', id })),
              { type: 'Maintenance', id: 'LIST' },
            ]
          : [{ type: 'Maintenance', id: 'LIST' }],
    }),
    getMyAssignedMaintenance: builder.query({
      query: (params) => ({
        url: '/maintenance/me/assigned',
        params,
      }),
      providesTags: (result) =>
        result?.data?.records
          ? [
              ...result.data.records.map(({ id }) => ({ type: 'Maintenance', id })),
              { type: 'Maintenance', id: 'MY_ASSIGNED' },
            ]
          : [{ type: 'Maintenance', id: 'MY_ASSIGNED' }],
    }),
    getVehicleMaintenanceLogs: builder.query({
      query: ({ vehicleId, ...params }) => ({
        url: `/maintenance/vehicle/${vehicleId}/logs`,
        params,
      }),
      providesTags: (result, error, { vehicleId }) => [
        { type: 'Maintenance', id: `VEHICLE_${vehicleId}` },
        { type: 'Maintenance', id: 'LOGS' },
      ],
    }),
    getMaintenanceRecord: builder.query({
      query: (id) => `/maintenance/${id}`,
      providesTags: (result, error, id) => [{ type: 'Maintenance', id }],
    }),
    getMaintenanceHistory: builder.query({
      query: ({ id, ...params }) => ({
        url: `/maintenance/${id}/history`,
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: 'MaintenanceHistory', id }],
    }),
    getMaintenanceMetaVehicles: builder.query({
      query: () => '/maintenance/meta/vehicles',
    }),
    getMaintenanceMetaMechanics: builder.query({
      query: () => '/maintenance/meta/mechanics',
    }),
    createMaintenance: builder.mutation({
      query: (body) => ({
        url: '/maintenance',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Maintenance', id: 'LIST' },
        { type: 'Maintenance', id: 'STATS' },
        { type: 'Maintenance', id: 'UPCOMING' },
        { type: 'Maintenance', id: 'ANALYTICS' },
        { type: 'Maintenance', id: 'MY_ASSIGNED' },
        'Dashboard',
        'Vehicle',
      ],
    }),
    updateMaintenance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/maintenance/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Maintenance', id },
        { type: 'Maintenance', id: 'LIST' },
        { type: 'Maintenance', id: 'STATS' },
        { type: 'Maintenance', id: 'MY_ASSIGNED' },
        { type: 'MaintenanceHistory', id },
        'Dashboard',
      ],
    }),
    deleteMaintenance: builder.mutation({
      query: (id) => ({
        url: `/maintenance/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Maintenance', id: 'LIST' },
        { type: 'Maintenance', id: 'STATS' },
        { type: 'Maintenance', id: 'UPCOMING' },
        { type: 'Maintenance', id: 'MY_ASSIGNED' },
      ],
    }),
    assignMechanic: builder.mutation({
      query: ({ id, mechanicId, mechanicIds }) => ({
        url: `/maintenance/${id}/assign`,
        method: 'POST',
        body: mechanicIds ? { mechanicIds } : { mechanicId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Maintenance', id },
        { type: 'Maintenance', id: 'LIST' },
        { type: 'Maintenance', id: 'MY_ASSIGNED' },
        { type: 'MaintenanceHistory', id },
      ],
    }),
    startMaintenance: builder.mutation({
      query: (id) => ({
        url: `/maintenance/${id}/start`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Maintenance', id },
        { type: 'Maintenance', id: 'LIST' },
        { type: 'Maintenance', id: 'STATS' },
        { type: 'Maintenance', id: 'MY_ASSIGNED' },
        { type: 'MaintenanceHistory', id },
        'Vehicle',
        'Dashboard',
      ],
    }),
    completeMaintenance: builder.mutation({
      queryFn: async ({ id, files = [], ...fields }) => {
        try {
          const formData = new FormData();
          files.forEach((file) => formData.append('documents', file));
          Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
            }
          });
          const { data } = await axiosInstance.post(`/maintenance/${id}/complete`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status,
              data: error.response?.data || error.message,
            },
          };
        }
      },
      invalidatesTags: (result, error, { id, vehicleId }) => [
        { type: 'Maintenance', id },
        { type: 'Maintenance', id: 'LIST' },
        { type: 'Maintenance', id: 'STATS' },
        { type: 'Maintenance', id: 'ANALYTICS' },
        { type: 'Maintenance', id: 'MY_ASSIGNED' },
        { type: 'Maintenance', id: 'LOGS' },
        ...(vehicleId ? [{ type: 'Maintenance', id: `VEHICLE_${vehicleId}` }] : []),
        { type: 'MaintenanceHistory', id },
        'Vehicle',
        'Dashboard',
      ],
    }),
    exportMaintenance: builder.mutation({
      queryFn: async (params) => {
        try {
          const response = await axiosInstance.get('/maintenance/export', {
            params,
            responseType: 'blob',
          });
          return { data: response.data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status,
              data: error.response?.data || error.message,
            },
          };
        }
      },
    }),
  }),
});

export const {
  useGetMaintenanceStatsQuery,
  useGetMaintenanceAnalyticsQuery,
  useGetUpcomingMaintenanceQuery,
  useGetMaintenanceRecordsQuery,
  useGetMyAssignedMaintenanceQuery,
  useGetVehicleMaintenanceLogsQuery,
  useGetMaintenanceRecordQuery,
  useGetMaintenanceHistoryQuery,
  useGetMaintenanceMetaVehiclesQuery,
  useGetMaintenanceMetaMechanicsQuery,
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
  useDeleteMaintenanceMutation,
  useAssignMechanicMutation,
  useStartMaintenanceMutation,
  useCompleteMaintenanceMutation,
  useExportMaintenanceMutation,
} = maintenanceApi;

export default maintenanceApi;
