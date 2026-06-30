import { baseApi } from './baseApi';
import axiosInstance from '../../services/axiosInstance';

export const routesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoutes: builder.query({
      query: (params) => ({
        url: '/routes',
        params,
      }),
      providesTags: (result) =>
        result?.data?.routes
          ? [
              ...result.data.routes.map(({ id }) => ({ type: 'Route', id })),
              { type: 'Route', id: 'LIST' },
            ]
          : [{ type: 'Route', id: 'LIST' }],
    }),
    getRouteStats: builder.query({
      query: () => '/routes/stats',
      providesTags: [{ type: 'Route', id: 'STATS' }],
    }),
    getTrafficPreview: builder.query({
      query: () => '/routes/traffic',
      providesTags: [{ type: 'Route', id: 'TRAFFIC' }],
    }),
    getRoute: builder.query({
      query: (id) => `/routes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Route', id }],
    }),
    getRouteHistory: builder.query({
      query: ({ id, ...params }) => ({
        url: `/routes/${id}/history`,
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: 'RouteHistory', id }],
    }),
    createRoute: builder.mutation({
      query: (body) => ({
        url: '/routes',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Route', id: 'LIST' }, { type: 'Route', id: 'STATS' }, 'Dashboard'],
    }),
    updateRoute: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/routes/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Route', id },
        { type: 'Route', id: 'LIST' },
        { type: 'Route', id: 'STATS' },
      ],
    }),
    deleteRoute: builder.mutation({
      query: (id) => ({
        url: `/routes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Route', id: 'LIST' }, { type: 'Route', id: 'STATS' }],
    }),
    optimizeRoute: builder.mutation({
      query: (id) => ({
        url: `/routes/${id}/optimize`,
        method: 'POST',
        body: {},
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Route', id },
        { type: 'Route', id: 'LIST' },
        { type: 'RouteHistory', id },
      ],
    }),
    duplicateRoute: builder.mutation({
      query: (id) => ({
        url: `/routes/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Route', id: 'LIST' }, { type: 'Route', id: 'STATS' }],
    }),
    exportRoutes: builder.mutation({
      queryFn: async (params) => {
        try {
          const response = await axiosInstance.get('/routes/export', {
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
  useGetRoutesQuery,
  useGetRouteStatsQuery,
  useGetTrafficPreviewQuery,
  useGetRouteQuery,
  useGetRouteHistoryQuery,
  useCreateRouteMutation,
  useUpdateRouteMutation,
  useDeleteRouteMutation,
  useOptimizeRouteMutation,
  useDuplicateRouteMutation,
  useExportRoutesMutation,
} = routesApi;

export default routesApi;
