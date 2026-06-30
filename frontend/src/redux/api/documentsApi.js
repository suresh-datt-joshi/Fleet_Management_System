import { baseApi } from './baseApi';
import axiosInstance from '../../services/axiosInstance';
import { API_BASE_URL } from '../../constants';

export const documentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDocumentStats: builder.query({
      query: () => '/documents/stats',
      providesTags: [{ type: 'Document', id: 'STATS' }],
    }),
    getDocumentAnalytics: builder.query({
      query: () => '/documents/analytics',
      providesTags: [{ type: 'Document', id: 'ANALYTICS' }],
    }),
    getExpiringDocuments: builder.query({
      query: (params) => ({
        url: '/documents/expiring',
        params,
      }),
      providesTags: [{ type: 'Document', id: 'EXPIRING' }],
    }),
    getDocuments: builder.query({
      query: (params) => ({
        url: '/documents',
        params,
      }),
      providesTags: (result) =>
        result?.data?.documents
          ? [
              ...result.data.documents.map(({ id }) => ({ type: 'Document', id })),
              { type: 'Document', id: 'LIST' },
            ]
          : [{ type: 'Document', id: 'LIST' }],
    }),
    getDocument: builder.query({
      query: (id) => `/documents/${id}`,
      providesTags: (result, error, id) => [{ type: 'Document', id }],
    }),
    getDocumentMetaVehicles: builder.query({
      query: () => '/documents/meta/vehicles',
    }),
    getDocumentMetaDrivers: builder.query({
      query: () => '/documents/meta/drivers',
    }),
    uploadDocument: builder.mutation({
      queryFn: async ({ file, ...fields }) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              formData.append(key, value);
            }
          });
          const { data } = await axiosInstance.post('/documents', formData, {
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
      invalidatesTags: [
        { type: 'Document', id: 'LIST' },
        { type: 'Document', id: 'STATS' },
        { type: 'Document', id: 'EXPIRING' },
        { type: 'Document', id: 'ANALYTICS' },
        'Dashboard',
      ],
    }),
    updateDocument: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/documents/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Document', id },
        { type: 'Document', id: 'LIST' },
        { type: 'Document', id: 'STATS' },
        { type: 'Document', id: 'EXPIRING' },
      ],
    }),
    replaceDocumentFile: builder.mutation({
      queryFn: async ({ id, file }) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const { data } = await axiosInstance.patch(`/documents/${id}/file`, formData, {
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
      invalidatesTags: (result, error, { id }) => [{ type: 'Document', id }, { type: 'Document', id: 'LIST' }],
    }),
    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Document', id: 'LIST' },
        { type: 'Document', id: 'STATS' },
        { type: 'Document', id: 'EXPIRING' },
        { type: 'Document', id: 'ANALYTICS' },
      ],
    }),
    exportDocuments: builder.mutation({
      queryFn: async (params) => {
        try {
          const response = await axiosInstance.get('/documents/export', {
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
    getDocumentDownload: builder.query({
      query: (id) => `/documents/${id}/download`,
    }),
  }),
});

export const {
  useGetDocumentStatsQuery,
  useGetDocumentAnalyticsQuery,
  useGetExpiringDocumentsQuery,
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useGetDocumentMetaVehiclesQuery,
  useGetDocumentMetaDriversQuery,
  useUploadDocumentMutation,
  useUpdateDocumentMutation,
  useReplaceDocumentFileMutation,
  useDeleteDocumentMutation,
  useExportDocumentsMutation,
  useLazyGetDocumentDownloadQuery,
} = documentsApi;

export const resolveFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = API_BASE_URL.replace('/api/v1', '');
  return `${base}${url}`;
};

export default documentsApi;
