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
      ],
    }),
    assignMechanic: builder.mutation({
      query: ({ id, mechanicId }) => ({
        url: `/maintenance/${id}/assign`,
        method: 'POST',
        body: { mechanicId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Maintenance', id },
        { type: 'Maintenance', id: 'LIST' },
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
        { type: 'MaintenanceHistory', id },
        'Vehicle',
        'Dashboard',
      ],
    }),
    completeMaintenance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/maintenance/${id}/complete`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Maintenance', id },
        { type: 'Maintenance', id: 'LIST' },
        { type: 'Maintenance', id: 'STATS' },
        { type: 'Maintenance', id: 'ANALYTICS' },
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
