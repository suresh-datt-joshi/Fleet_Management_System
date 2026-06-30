import { baseApi } from './baseApi';
import axiosInstance from '../../services/axiosInstance';

export const driversApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDrivers: builder.query({
      query: (params) => ({ url: '/drivers', params }),
      providesTags: (result) =>
        result?.data?.drivers
          ? [
              ...result.data.drivers.map(({ _id }) => ({ type: 'Driver', id: _id })),
              { type: 'Driver', id: 'LIST' },
            ]
          : [{ type: 'Driver', id: 'LIST' }],
    }),
    getDriverStats: builder.query({
      query: () => '/drivers/stats',
      providesTags: [{ type: 'Driver', id: 'STATS' }],
    }),
    getDriver: builder.query({
      query: (id) => `/drivers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Driver', id }],
    }),
    getDriverHistory: builder.query({
      query: ({ id, ...params }) => ({ url: `/drivers/${id}/history`, params }),
      providesTags: (result, error, { id }) => [{ type: 'DriverHistory', id }],
    }),
    getAvailableVehicles: builder.query({
      query: () => '/drivers/meta/vehicles',
    }),
    createDriver: builder.mutation({
      query: (body) => ({ url: '/drivers', method: 'POST', body }),
      invalidatesTags: [{ type: 'Driver', id: 'LIST' }, { type: 'Driver', id: 'STATS' }, 'Dashboard', 'Vehicle'],
    }),
    updateDriver: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/drivers/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Driver', id },
        { type: 'Driver', id: 'LIST' },
        { type: 'Driver', id: 'STATS' },
      ],
    }),
    deleteDriver: builder.mutation({
      query: (id) => ({ url: `/drivers/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Driver', id: 'LIST' }, { type: 'Driver', id: 'STATS' }, 'Dashboard', 'Vehicle'],
    }),
    assignVehicle: builder.mutation({
      query: ({ driverId, vehicleId }) => ({
        url: `/drivers/${driverId}/assign-vehicle`,
        method: 'POST',
        body: { vehicleId },
      }),
      invalidatesTags: (result, error, { driverId }) => [
        { type: 'Driver', id: driverId },
        { type: 'Driver', id: 'LIST' },
        'Vehicle',
      ],
    }),
    unassignVehicle: builder.mutation({
      query: (driverId) => ({ url: `/drivers/${driverId}/assign-vehicle`, method: 'DELETE' }),
      invalidatesTags: (result, error, driverId) => [
        { type: 'Driver', id: driverId },
        { type: 'Driver', id: 'LIST' },
        'Vehicle',
      ],
    }),
    uploadDriverAvatar: builder.mutation({
      queryFn: async ({ driverId, file }) => {
        try {
          const formData = new FormData();
          formData.append('avatar', file);
          const { data } = await axiosInstance.post(`/drivers/${driverId}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { data };
        } catch (error) {
          return { error: { status: error.response?.status || 500, data: error.response?.data } };
        }
      },
      invalidatesTags: (result, error, { driverId }) => [{ type: 'Driver', id: driverId }],
    }),
    uploadDriverDocument: builder.mutation({
      queryFn: async ({ driverId, file, type, name, expiryDate }) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          if (type) formData.append('type', type);
          if (name) formData.append('name', name);
          if (expiryDate) formData.append('expiryDate', expiryDate);
          const { data } = await axiosInstance.post(`/drivers/${driverId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { data };
        } catch (error) {
          return { error: { status: error.response?.status || 500, data: error.response?.data } };
        }
      },
      invalidatesTags: (result, error, { driverId }) => [{ type: 'Driver', id: driverId }],
    }),
    deleteDriverDocument: builder.mutation({
      query: ({ driverId, documentId }) => ({
        url: `/drivers/${driverId}/documents/${documentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { driverId }) => [{ type: 'Driver', id: driverId }],
    }),
    exportDrivers: builder.mutation({
      queryFn: async (params) => {
        try {
          const response = await axiosInstance.get('/drivers/export', { params, responseType: 'blob' });
          return { data: response.data };
        } catch (error) {
          return { error: { status: error.response?.status || 500, data: error.response?.data } };
        }
      },
    }),
  }),
});

export const {
  useGetDriversQuery,
  useGetDriverStatsQuery,
  useGetDriverQuery,
  useGetDriverHistoryQuery,
  useGetAvailableVehiclesQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useDeleteDriverMutation,
  useAssignVehicleMutation,
  useUnassignVehicleMutation,
  useUploadDriverAvatarMutation,
  useUploadDriverDocumentMutation,
  useDeleteDriverDocumentMutation,
  useExportDriversMutation,
} = driversApi;

export default driversApi;
