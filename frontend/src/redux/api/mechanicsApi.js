import { baseApi } from './baseApi';
import axiosInstance from '../../services/axiosInstance';

export const mechanicsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMechanics: builder.query({
      query: (params) => ({ url: '/mechanics', params }),
      providesTags: (result) =>
        result?.data?.mechanics
          ? [
              ...result.data.mechanics.map(({ _id }) => ({ type: 'Mechanic', id: _id })),
              { type: 'Mechanic', id: 'LIST' },
            ]
          : [{ type: 'Mechanic', id: 'LIST' }],
    }),
    getMechanicStats: builder.query({
      query: () => '/mechanics/stats',
      providesTags: [{ type: 'Mechanic', id: 'STATS' }],
    }),
    getMechanic: builder.query({
      query: (id) => `/mechanics/${id}`,
      providesTags: (result, error, id) => [{ type: 'Mechanic', id }],
    }),
    getMechanicHistory: builder.query({
      query: ({ id, ...params }) => ({ url: `/mechanics/${id}/history`, params }),
      providesTags: (result, error, { id }) => [{ type: 'MechanicHistory', id }],
    }),
    createMechanic: builder.mutation({
      query: (body) => ({ url: '/mechanics', method: 'POST', body }),
      invalidatesTags: [{ type: 'Mechanic', id: 'LIST' }, { type: 'Mechanic', id: 'STATS' }, 'Dashboard', 'Maintenance'],
    }),
    updateMechanic: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/mechanics/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Mechanic', id },
        { type: 'Mechanic', id: 'LIST' },
        { type: 'Mechanic', id: 'STATS' },
        'Maintenance',
      ],
    }),
    deleteMechanic: builder.mutation({
      query: (id) => ({ url: `/mechanics/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Mechanic', id: 'LIST' }, { type: 'Mechanic', id: 'STATS' }, 'Dashboard', 'Maintenance'],
    }),
    uploadMechanicAvatar: builder.mutation({
      queryFn: async ({ mechanicId, file }) => {
        try {
          const formData = new FormData();
          formData.append('avatar', file);
          const { data } = await axiosInstance.post(`/mechanics/${mechanicId}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { data };
        } catch (error) {
          return { error: { status: error.response?.status || 500, data: error.response?.data } };
        }
      },
      invalidatesTags: (result, error, { mechanicId }) => [{ type: 'Mechanic', id: mechanicId }],
    }),
    uploadMechanicDocument: builder.mutation({
      queryFn: async ({ mechanicId, file, type, name, expiryDate }) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          if (type) formData.append('type', type);
          if (name) formData.append('name', name);
          if (expiryDate) formData.append('expiryDate', expiryDate);
          const { data } = await axiosInstance.post(`/mechanics/${mechanicId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { data };
        } catch (error) {
          return { error: { status: error.response?.status || 500, data: error.response?.data } };
        }
      },
      invalidatesTags: (result, error, { mechanicId }) => [{ type: 'Mechanic', id: mechanicId }],
    }),
    deleteMechanicDocument: builder.mutation({
      query: ({ mechanicId, documentId }) => ({
        url: `/mechanics/${mechanicId}/documents/${documentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { mechanicId }) => [{ type: 'Mechanic', id: mechanicId }],
    }),
    exportMechanics: builder.mutation({
      queryFn: async (params) => {
        try {
          const response = await axiosInstance.get('/mechanics/export', { params, responseType: 'blob' });
          return { data: response.data };
        } catch (error) {
          return { error: { status: error.response?.status || 500, data: error.response?.data } };
        }
      },
    }),
  }),
});

export const {
  useGetMechanicsQuery,
  useGetMechanicStatsQuery,
  useGetMechanicQuery,
  useGetMechanicHistoryQuery,
  useCreateMechanicMutation,
  useUpdateMechanicMutation,
  useDeleteMechanicMutation,
  useUploadMechanicAvatarMutation,
  useUploadMechanicDocumentMutation,
  useDeleteMechanicDocumentMutation,
  useExportMechanicsMutation,
} = mechanicsApi;

export default mechanicsApi;
