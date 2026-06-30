import { baseApi } from './baseApi';
import axiosInstance from '../../services/axiosInstance';

export const vehiclesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVehicles: builder.query({
      query: (params) => ({
        url: '/vehicles',
        params,
      }),
      providesTags: (result) =>
        result?.data?.vehicles
          ? [
              ...result.data.vehicles.map(({ _id }) => ({ type: 'Vehicle', id: _id })),
              { type: 'Vehicle', id: 'LIST' },
            ]
          : [{ type: 'Vehicle', id: 'LIST' }],
    }),
    getVehicleStats: builder.query({
      query: () => '/vehicles/stats',
      providesTags: [{ type: 'Vehicle', id: 'STATS' }],
    }),
    getVehicle: builder.query({
      query: (id) => `/vehicles/${id}`,
      providesTags: (result, error, id) => [{ type: 'Vehicle', id }],
    }),
    getVehicleHistory: builder.query({
      query: ({ id, ...params }) => ({
        url: `/vehicles/${id}/history`,
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: 'VehicleHistory', id }],
    }),
    getAvailableDrivers: builder.query({
      query: () => '/vehicles/meta/drivers',
    }),
    createVehicle: builder.mutation({
      query: (body) => ({
        url: '/vehicles',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Vehicle', id: 'LIST' }, { type: 'Vehicle', id: 'STATS' }, 'Dashboard'],
    }),
    updateVehicle: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/vehicles/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Vehicle', id },
        { type: 'Vehicle', id: 'LIST' },
        { type: 'Vehicle', id: 'STATS' },
      ],
    }),
    deleteVehicle: builder.mutation({
      query: (id) => ({
        url: `/vehicles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Vehicle', id: 'LIST' }, { type: 'Vehicle', id: 'STATS' }, 'Dashboard'],
    }),
    assignDriver: builder.mutation({
      query: ({ vehicleId, driverId }) => ({
        url: `/vehicles/${vehicleId}/assign-driver`,
        method: 'POST',
        body: { driverId },
      }),
      invalidatesTags: (result, error, { vehicleId }) => [
        { type: 'Vehicle', id: vehicleId },
        { type: 'Vehicle', id: 'LIST' },
      ],
    }),
    unassignDriver: builder.mutation({
      query: (vehicleId) => ({
        url: `/vehicles/${vehicleId}/assign-driver`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, vehicleId) => [
        { type: 'Vehicle', id: vehicleId },
        { type: 'Vehicle', id: 'LIST' },
      ],
    }),
    uploadVehicleImage: builder.mutation({
      queryFn: async ({ vehicleId, file }) => {
        try {
          const formData = new FormData();
          formData.append('image', file);
          const { data } = await axiosInstance.post(`/vehicles/${vehicleId}/images`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status || 500,
              data: error.response?.data || { message: error.message },
            },
          };
        }
      },
      invalidatesTags: (result, error, { vehicleId }) => [{ type: 'Vehicle', id: vehicleId }],
    }),
    deleteVehicleImage: builder.mutation({
      query: ({ vehicleId, publicId }) => ({
        url: `/vehicles/${vehicleId}/images/${encodeURIComponent(publicId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { vehicleId }) => [{ type: 'Vehicle', id: vehicleId }],
    }),
    exportVehicles: builder.mutation({
      queryFn: async (params) => {
        try {
          const response = await axiosInstance.get('/vehicles/export', {
            params,
            responseType: 'blob',
          });
          return { data: response.data };
        } catch (error) {
          return {
            error: {
              status: error.response?.status || 500,
              data: error.response?.data || { message: error.message },
            },
          };
        }
      },
    }),
  }),
});

export const {
  useGetVehiclesQuery,
  useGetVehicleStatsQuery,
  useGetVehicleQuery,
  useGetVehicleHistoryQuery,
  useGetAvailableDriversQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useAssignDriverMutation,
  useUnassignDriverMutation,
  useUploadVehicleImageMutation,
  useDeleteVehicleImageMutation,
  useExportVehiclesMutation,
} = vehiclesApi;

export default vehiclesApi;
