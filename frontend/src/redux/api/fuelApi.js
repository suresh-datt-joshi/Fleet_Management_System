import { baseApi } from './baseApi';
import axiosInstance from '../../services/axiosInstance';

export const fuelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFuelStats: builder.query({
      query: () => '/fuel/stats',
      providesTags: [{ type: 'Fuel', id: 'STATS' }],
    }),
    getFuelAnalytics: builder.query({
      query: (params) => ({
        url: '/fuel/analytics',
        params,
      }),
      providesTags: [{ type: 'Fuel', id: 'ANALYTICS' }],
    }),
    getFuelLogs: builder.query({
      query: (params) => ({
        url: '/fuel/logs',
        params,
      }),
      providesTags: (result) =>
        result?.data?.logs
          ? [
              ...result.data.logs.map(({ id }) => ({ type: 'FuelLog', id })),
              { type: 'FuelLog', id: 'LIST' },
            ]
          : [{ type: 'FuelLog', id: 'LIST' }],
    }),
    getFuelLog: builder.query({
      query: (id) => `/fuel/logs/${id}`,
      providesTags: (result, error, id) => [{ type: 'FuelLog', id }],
    }),
    getFuelStations: builder.query({
      query: (params) => ({
        url: '/fuel/stations',
        params,
      }),
      providesTags: (result) =>
        result?.data?.stations
          ? [
              ...result.data.stations.map(({ id }) => ({ type: 'FuelStation', id })),
              { type: 'FuelStation', id: 'LIST' },
            ]
          : [{ type: 'FuelStation', id: 'LIST' }],
    }),
    getMetaVehicles: builder.query({
      query: () => '/fuel/meta/vehicles',
    }),
    getMetaStations: builder.query({
      query: () => '/fuel/meta/stations',
    }),
    createFuelLog: builder.mutation({
      query: (body) => ({
        url: '/fuel/logs',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'FuelLog', id: 'LIST' },
        { type: 'Fuel', id: 'STATS' },
        { type: 'Fuel', id: 'ANALYTICS' },
        'Dashboard',
        'Vehicle',
      ],
    }),
    updateFuelLog: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fuel/logs/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FuelLog', id },
        { type: 'FuelLog', id: 'LIST' },
        { type: 'Fuel', id: 'STATS' },
        { type: 'Fuel', id: 'ANALYTICS' },
      ],
    }),
    deleteFuelLog: builder.mutation({
      query: (id) => ({
        url: `/fuel/logs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'FuelLog', id: 'LIST' },
        { type: 'Fuel', id: 'STATS' },
        { type: 'Fuel', id: 'ANALYTICS' },
      ],
    }),
    createFuelStation: builder.mutation({
      query: (body) => ({
        url: '/fuel/stations',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'FuelStation', id: 'LIST' }, { type: 'Fuel', id: 'STATS' }],
    }),
    updateFuelStation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/fuel/stations/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'FuelStation', id },
        { type: 'FuelStation', id: 'LIST' },
      ],
    }),
    deleteFuelStation: builder.mutation({
      query: (id) => ({
        url: `/fuel/stations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'FuelStation', id: 'LIST' }, { type: 'Fuel', id: 'STATS' }],
    }),
    exportFuelLogs: builder.mutation({
      queryFn: async (params) => {
        try {
          const response = await axiosInstance.get('/fuel/logs/export', {
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
  useGetFuelStatsQuery,
  useGetFuelAnalyticsQuery,
  useGetFuelLogsQuery,
  useGetFuelLogQuery,
  useGetFuelStationsQuery,
  useGetMetaVehiclesQuery,
  useGetMetaStationsQuery,
  useCreateFuelLogMutation,
  useUpdateFuelLogMutation,
  useDeleteFuelLogMutation,
  useCreateFuelStationMutation,
  useUpdateFuelStationMutation,
  useDeleteFuelStationMutation,
  useExportFuelLogsMutation,
} = fuelApi;

export default fuelApi;
