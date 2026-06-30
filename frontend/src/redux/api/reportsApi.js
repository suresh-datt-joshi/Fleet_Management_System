import { baseApi } from './baseApi';
import axiosInstance from '../../services/axiosInstance';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReportCatalog: builder.query({
      query: () => '/reports/catalog',
      providesTags: [{ type: 'Report', id: 'CATALOG' }],
    }),
    getReportStats: builder.query({
      query: () => '/reports/stats',
      providesTags: [{ type: 'Report', id: 'STATS' }],
    }),
    getReportHistory: builder.query({
      query: (params) => ({
        url: '/reports/history',
        params,
      }),
      providesTags: (result) =>
        result?.data?.reports
          ? [
              ...result.data.reports.map(({ id }) => ({ type: 'Report', id })),
              { type: 'Report', id: 'HISTORY' },
            ]
          : [{ type: 'Report', id: 'HISTORY' }],
    }),
    getFleetSummaryReport: builder.query({
      query: (params) => ({
        url: '/reports/summary',
        params,
      }),
      providesTags: [{ type: 'Report', id: 'SUMMARY' }],
    }),
    getFinancialReport: builder.query({
      query: (params) => ({
        url: '/reports/financial',
        params,
      }),
      providesTags: [{ type: 'Report', id: 'FINANCIAL' }],
    }),
    getOperationalReport: builder.query({
      query: (params) => ({
        url: '/reports/operational',
        params,
      }),
      providesTags: [{ type: 'Report', id: 'OPERATIONAL' }],
    }),
    getReportPreview: builder.query({
      query: ({ type, ...params }) => ({
        url: `/reports/preview/${type}`,
        params,
      }),
    }),
    exportReport: builder.mutation({
      queryFn: async (params) => {
        try {
          const response = await axiosInstance.get('/reports/export', {
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
      invalidatesTags: [
        { type: 'Report', id: 'HISTORY' },
        { type: 'Report', id: 'STATS' },
      ],
    }),
  }),
});

export const {
  useGetReportCatalogQuery,
  useGetReportStatsQuery,
  useGetReportHistoryQuery,
  useGetFleetSummaryReportQuery,
  useGetFinancialReportQuery,
  useGetOperationalReportQuery,
  useGetReportPreviewQuery,
  useExportReportMutation,
} = reportsApi;

export default reportsApi;
