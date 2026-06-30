import { baseApi } from './baseApi';

export const trackingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTrackingStats: builder.query({
      query: () => '/gps/stats',
      providesTags: [{ type: 'Tracking', id: 'STATS' }],
    }),
    getLiveVehicles: builder.query({
      query: (params) => ({
        url: '/gps/live',
        params,
      }),
      providesTags: [{ type: 'Tracking', id: 'LIVE' }],
    }),
    getLiveTrackingDashboard: builder.query({
      query: () => '/gps/dashboard',
      providesTags: [{ type: 'Tracking', id: 'DASHBOARD' }],
    }),
    getVehicleLive: builder.query({
      query: (vehicleId) => `/gps/vehicles/${vehicleId}`,
      providesTags: (result, error, vehicleId) => [{ type: 'Tracking', id: vehicleId }],
    }),
    getVehicleRouteHistory: builder.query({
      query: ({ vehicleId, ...params }) => ({
        url: `/gps/vehicles/${vehicleId}/history`,
        params,
      }),
      providesTags: (result, error, { vehicleId }) => [{ type: 'TrackingHistory', id: vehicleId }],
    }),
    getGeofences: builder.query({
      query: (params) => ({
        url: '/gps/geofences',
        params,
      }),
      providesTags: [{ type: 'Geofence', id: 'LIST' }],
    }),
    getGeofenceEvents: builder.query({
      query: (params) => ({
        url: '/gps/geofences/events',
        params,
      }),
      providesTags: [{ type: 'Geofence', id: 'EVENTS' }],
    }),
    createGeofence: builder.mutation({
      query: (body) => ({
        url: '/gps/geofences',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Geofence', id: 'LIST' }, { type: 'Tracking', id: 'STATS' }],
    }),
    updateGeofence: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/gps/geofences/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Geofence', id: 'LIST' }, { type: 'Tracking', id: 'STATS' }],
    }),
    deleteGeofence: builder.mutation({
      query: (id) => ({
        url: `/gps/geofences/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Geofence', id: 'LIST' }, { type: 'Tracking', id: 'STATS' }],
    }),
    triggerGpsSimulation: builder.mutation({
      query: () => ({
        url: '/gps/simulate',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Tracking', id: 'LIVE' }, { type: 'Tracking', id: 'DASHBOARD' }],
    }),
  }),
});

export const {
  useGetTrackingStatsQuery,
  useGetLiveVehiclesQuery,
  useGetLiveTrackingDashboardQuery,
  useGetVehicleLiveQuery,
  useGetVehicleRouteHistoryQuery,
  useGetGeofencesQuery,
  useGetGeofenceEventsQuery,
  useCreateGeofenceMutation,
  useUpdateGeofenceMutation,
  useDeleteGeofenceMutation,
  useTriggerGpsSimulationMutation,
} = trackingApi;

export default trackingApi;
