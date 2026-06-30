import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query({
      query: () => '/dashboard/overview',
      providesTags: ['Dashboard'],
    }),
    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary',
      providesTags: ['Dashboard'],
    }),
    getDashboardCharts: builder.query({
      query: () => '/dashboard/charts',
      providesTags: ['Dashboard'],
    }),
    getDashboardActivities: builder.query({
      query: (limit = 10) => `/dashboard/activities?limit=${limit}`,
      providesTags: ['Dashboard'],
    }),
    getDashboardAlerts: builder.query({
      query: (limit = 8) => `/dashboard/alerts?limit=${limit}`,
      providesTags: ['Dashboard'],
    }),
    getLiveVehicles: builder.query({
      query: () => '/dashboard/live-vehicles',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetDashboardOverviewQuery,
  useGetDashboardSummaryQuery,
  useGetDashboardChartsQuery,
  useGetDashboardActivitiesQuery,
  useGetDashboardAlertsQuery,
  useGetLiveVehiclesQuery,
} = dashboardApi;

export default dashboardApi;
