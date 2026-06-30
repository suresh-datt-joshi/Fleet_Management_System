import { baseApi } from './baseApi';
import axiosInstance from '../../services/axiosInstance';

export const alertsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAlertStats: builder.query({
      query: () => '/alerts/stats',
      providesTags: [{ type: 'Alert', id: 'STATS' }],
    }),
    getAlertAnalytics: builder.query({
      query: (params) => ({
        url: '/alerts/analytics',
        params,
      }),
      providesTags: [{ type: 'Alert', id: 'ANALYTICS' }],
    }),
    getAlerts: builder.query({
      query: (params) => ({
        url: '/alerts',
        params,
      }),
      providesTags: (result) =>
        result?.data?.alerts
          ? [
              ...result.data.alerts.map(({ id }) => ({ type: 'Alert', id })),
              { type: 'Alert', id: 'LIST' },
            ]
          : [{ type: 'Alert', id: 'LIST' }],
    }),
    getAlert: builder.query({
      query: (id) => `/alerts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Alert', id }],
    }),
    getAlertMetaVehicles: builder.query({
      query: () => '/alerts/meta/vehicles',
    }),
    getAlertMetaDrivers: builder.query({
      query: () => '/alerts/meta/drivers',
    }),
    getNotificationStats: builder.query({
      query: () => '/notifications/stats',
      providesTags: [{ type: 'Notification', id: 'STATS' }],
    }),
    getNotifications: builder.query({
      query: (params) => ({
        url: '/notifications',
        params,
      }),
      providesTags: (result) =>
        result?.data?.notifications
          ? [
              ...result.data.notifications.map(({ id }) => ({ type: 'Notification', id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),
    createAlert: builder.mutation({
      query: (body) => ({
        url: '/alerts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Alert', id: 'LIST' },
        { type: 'Alert', id: 'STATS' },
        { type: 'Alert', id: 'ANALYTICS' },
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'STATS' },
        'Dashboard',
      ],
    }),
    updateAlert: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/alerts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Alert', id },
        { type: 'Alert', id: 'LIST' },
        { type: 'Alert', id: 'STATS' },
        'Dashboard',
      ],
    }),
    markAlertAsRead: builder.mutation({
      query: (id) => ({
        url: `/alerts/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Alert', id },
        { type: 'Alert', id: 'LIST' },
        { type: 'Alert', id: 'STATS' },
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'STATS' },
        'Dashboard',
      ],
    }),
    markAllAlertsAsRead: builder.mutation({
      query: () => ({
        url: '/alerts/mark-all-read',
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Alert', id: 'LIST' },
        { type: 'Alert', id: 'STATS' },
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'STATS' },
        'Dashboard',
      ],
    }),
    deleteAlert: builder.mutation({
      query: (id) => ({
        url: `/alerts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Alert', id: 'LIST' },
        { type: 'Alert', id: 'STATS' },
        { type: 'Notification', id: 'LIST' },
        'Dashboard',
      ],
    }),
    bulkDeleteAlerts: builder.mutation({
      query: (ids) => ({
        url: '/alerts/bulk-delete',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: [
        { type: 'Alert', id: 'LIST' },
        { type: 'Alert', id: 'STATS' },
        'Dashboard',
      ],
    }),
    syncAlerts: builder.mutation({
      query: () => ({
        url: '/alerts/sync',
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Alert', id: 'LIST' },
        { type: 'Alert', id: 'STATS' },
        { type: 'Alert', id: 'ANALYTICS' },
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'STATS' },
        'Dashboard',
      ],
    }),
    markNotificationAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'STATS' },
        'Dashboard',
      ],
    }),
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'STATS' },
        'Dashboard',
      ],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'STATS' },
      ],
    }),
    exportAlerts: builder.mutation({
      queryFn: async (params) => {
        try {
          const response = await axiosInstance.get('/alerts/export', {
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
  useGetAlertStatsQuery,
  useGetAlertAnalyticsQuery,
  useGetAlertsQuery,
  useGetAlertQuery,
  useGetAlertMetaVehiclesQuery,
  useGetAlertMetaDriversQuery,
  useGetNotificationStatsQuery,
  useGetNotificationsQuery,
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useMarkAlertAsReadMutation,
  useMarkAllAlertsAsReadMutation,
  useDeleteAlertMutation,
  useBulkDeleteAlertsMutation,
  useSyncAlertsMutation,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useExportAlertsMutation,
} = alertsApi;

export default alertsApi;
