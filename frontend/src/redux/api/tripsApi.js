import { baseApi } from './baseApi';
import axiosInstance from '../../services/axiosInstance';
import { FINANCIALLY_CLOSED_TRIP_STATUSES, TRIP_STATUS } from '../../constants';

const findTripInCache = (getState, id) => {
  const queries = getState()?.api?.queries ?? {};

  for (const query of Object.values(queries)) {
    if (query?.status !== 'fulfilled') continue;

    if (query?.endpointName === 'getTrip' && query?.originalArgs === id) {
      return query?.data?.data?.trip ?? null;
    }

    if (query?.endpointName === 'getTrips' || query?.endpointName === 'getPendingReviewTrips') {
      const match = query?.data?.data?.trips?.find((trip) => trip.id === id);
      if (match) return match;
    }
  }

  return null;
};

const applyDeletedTripToStatsDraft = (draft, trip) => {
  if (!draft?.data || !trip) return;

  draft.data.total = Math.max(0, (draft.data.total || 0) - 1);

  if (trip.status === TRIP_STATUS.PENDING_DISPATCHER_REVIEW) {
    draft.data.pendingReview = Math.max(0, (draft.data.pendingReview || 0) - 1);
    return;
  }

  if (trip.status === TRIP_STATUS.SCHEDULED) {
    draft.data.scheduled = Math.max(0, (draft.data.scheduled || 0) - 1);
    return;
  }

  if (trip.status === TRIP_STATUS.CANCELLED) {
    draft.data.cancelled = Math.max(0, (draft.data.cancelled || 0) - 1);
    return;
  }

  if (!FINANCIALLY_CLOSED_TRIP_STATUSES.includes(trip.status)) return;

  const revenue = trip.revenue || 0;
  const expenses = trip.expenses || 0;
  const profit = Math.round((revenue - expenses) * 100) / 100;

  draft.data.completed = Math.max(0, (draft.data.completed || 0) - 1);
  draft.data.totalRevenue = Math.round(((draft.data.totalRevenue || 0) - revenue) * 100) / 100;
  draft.data.totalExpenses = Math.round(((draft.data.totalExpenses || 0) - expenses) * 100) / 100;
  draft.data.totalProfit = Math.round(((draft.data.totalProfit || 0) - profit) * 100) / 100;
  draft.data.totalDistance = Math.round(((draft.data.totalDistance || 0) - (trip.distance || 0)) * 100) / 100;
};

export const resolveReceiptUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  return `${base}${url}`;
};

export const tripsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTripStats: builder.query({
      query: () => '/trips/stats',
      providesTags: [{ type: 'Trip', id: 'STATS' }],
    }),
    getTripAnalytics: builder.query({
      query: (params) => ({
        url: '/trips/analytics',
        params,
      }),
      providesTags: [{ type: 'Trip', id: 'ANALYTICS' }],
    }),
    getUpcomingTrips: builder.query({
      query: (params) => ({
        url: '/trips/upcoming',
        params,
      }),
      providesTags: [{ type: 'Trip', id: 'UPCOMING' }],
    }),
    getTrips: builder.query({
      query: (params) => ({
        url: '/trips',
        params,
      }),
      providesTags: (result) =>
        result?.data?.trips
          ? [
              ...result.data.trips.map(({ id }) => ({ type: 'Trip', id })),
              { type: 'Trip', id: 'LIST' },
            ]
          : [{ type: 'Trip', id: 'LIST' }],
    }),
    getPendingReviewTrips: builder.query({
      query: (params) => ({
        url: '/trips/pending-review',
        params,
      }),
      providesTags: (result) =>
        result?.data?.trips
          ? [
              ...result.data.trips.map(({ id }) => ({ type: 'Trip', id })),
              { type: 'Trip', id: 'PENDING_REVIEW' },
            ]
          : [{ type: 'Trip', id: 'PENDING_REVIEW' }],
    }),
    getTrip: builder.query({
      query: (id) => `/trips/${id}`,
      providesTags: (result, error, id) => [{ type: 'Trip', id }, { type: 'TripExpense', id }],
    }),
    getMyDriverProfile: builder.query({
      query: () => '/trips/me/driver',
      providesTags: [{ type: 'Trip', id: 'MY_DRIVER' }],
    }),
    getMyActiveTrip: builder.query({
      query: () => '/trips/me/active',
      providesTags: [{ type: 'Trip', id: 'MY_ACTIVE' }],
    }),
    getMyScheduledTrips: builder.query({
      query: () => '/trips/me/scheduled',
      providesTags: [{ type: 'Trip', id: 'MY_SCHEDULED' }],
    }),
    getTripExpenses: builder.query({
      query: (id) => `/trips/${id}/expenses`,
      providesTags: (result, error, id) => [{ type: 'TripExpense', id }],
    }),
    getTripHistory: builder.query({
      query: ({ id, ...params }) => ({
        url: `/trips/${id}/history`,
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: 'TripHistory', id }],
    }),
    getTripMetaDrivers: builder.query({
      query: () => '/trips/meta/drivers',
    }),
    getTripMetaVehicles: builder.query({
      query: () => '/trips/meta/vehicles',
    }),
    getTripMetaRoutes: builder.query({
      query: () => '/trips/meta/routes',
    }),
    getTripMetaFuelStations: builder.query({
      query: () => '/trips/meta/fuel-stations',
    }),
    createTrip: builder.mutation({
      query: (body) => ({
        url: '/trips',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Trip', id: 'LIST' },
        { type: 'Trip', id: 'STATS' },
        { type: 'Trip', id: 'UPCOMING' },
        { type: 'Trip', id: 'ANALYTICS' },
        { type: 'Trip', id: 'MY_SCHEDULED' },
        { type: 'Trip', id: 'MY_ACTIVE' },
        'Dashboard',
        'Driver',
        'Vehicle',
      ],
    }),
    updateTrip: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/trips/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Trip', id },
        { type: 'Trip', id: 'LIST' },
        { type: 'Trip', id: 'STATS' },
      ],
    }),
    deleteTrip: builder.mutation({
      query: (id) => ({
        url: `/trips/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const trip = findTripInCache(getState, id);
        const patchResult =
          trip &&
          dispatch(
            baseApi.util.updateQueryData('getTripStats', undefined, (draft) => {
              applyDeletedTripToStatsDraft(draft, trip);
            })
          );

        try {
          await queryFulfilled;
        } catch {
          patchResult?.undo();
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Trip', id },
        { type: 'Trip', id: 'LIST' },
        { type: 'Trip', id: 'STATS' },
        { type: 'Trip', id: 'PENDING_REVIEW' },
        { type: 'Trip', id: 'UPCOMING' },
        { type: 'Trip', id: 'ANALYTICS' },
        'Dashboard',
      ],
    }),
    startTrip: builder.mutation({
      query: (id) => ({
        url: `/trips/${id}/start`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Trip', id },
        { type: 'Trip', id: 'LIST' },
        { type: 'Trip', id: 'STATS' },
        { type: 'Trip', id: 'MY_ACTIVE' },
        { type: 'Trip', id: 'MY_SCHEDULED' },
        { type: 'TripHistory', id },
        'Driver',
        'Dashboard',
      ],
    }),
    addTripExpense: builder.mutation({
      queryFn: async ({ tripId, file, ...fields }) => {
        try {
          const formData = new FormData();
          if (file) formData.append('receipt', file);
          Object.entries(fields).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              formData.append(key, value);
            }
          });
          const { data } = await axiosInstance.post(`/trips/${tripId}/expenses`, formData, {
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
      invalidatesTags: (result, error, { tripId }) => [
        { type: 'Trip', id: tripId },
        { type: 'Trip', id: 'MY_ACTIVE' },
        { type: 'TripExpense', id: tripId },
        { type: 'TripHistory', id: tripId },
        { type: 'FuelLog', id: 'LIST' },
        { type: 'Fuel', id: 'STATS' },
        'Vehicle',
      ],
    }),
    updateConsignment: builder.mutation({
      query: ({ tripId, ...body }) => ({
        url: `/trips/${tripId}/consignment`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { tripId }) => [
        { type: 'Trip', id: tripId },
        { type: 'Trip', id: 'MY_ACTIVE' },
        { type: 'TripHistory', id: tripId },
      ],
    }),
    completeTrip: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/trips/${id}/complete`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Trip', id },
        { type: 'Trip', id: 'LIST' },
        { type: 'Trip', id: 'STATS' },
        { type: 'Trip', id: 'ANALYTICS' },
        { type: 'Trip', id: 'PENDING_REVIEW' },
        { type: 'Trip', id: 'MY_ACTIVE' },
        { type: 'Trip', id: 'MY_SCHEDULED' },
        { type: 'TripHistory', id },
        { type: 'TripExpense', id },
        { type: 'FuelLog', id: 'LIST' },
        { type: 'Fuel', id: 'STATS' },
        { type: 'Fuel', id: 'ANALYTICS' },
        'Driver',
        'Vehicle',
        'Dashboard',
      ],
    }),
    reviewTrip: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/trips/${id}/review`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Trip', id },
        { type: 'Trip', id: 'LIST' },
        { type: 'Trip', id: 'STATS' },
        { type: 'Trip', id: 'ANALYTICS' },
        { type: 'Trip', id: 'PENDING_REVIEW' },
        { type: 'TripHistory', id },
        'Dashboard',
      ],
    }),
    cancelTrip: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/trips/${id}/cancel`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Trip', id },
        { type: 'Trip', id: 'LIST' },
        { type: 'Trip', id: 'STATS' },
        { type: 'Trip', id: 'UPCOMING' },
        { type: 'TripHistory', id },
        'Driver',
        'Dashboard',
      ],
    }),
    exportTrips: builder.mutation({
      queryFn: async (params) => {
        try {
          const response = await axiosInstance.get('/trips/export', {
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
  useGetTripStatsQuery,
  useGetTripAnalyticsQuery,
  useGetUpcomingTripsQuery,
  useGetTripsQuery,
  useGetPendingReviewTripsQuery,
  useGetTripQuery,
  useGetMyDriverProfileQuery,
  useGetMyActiveTripQuery,
  useGetMyScheduledTripsQuery,
  useGetTripExpensesQuery,
  useGetTripHistoryQuery,
  useGetTripMetaDriversQuery,
  useGetTripMetaVehiclesQuery,
  useGetTripMetaRoutesQuery,
  useGetTripMetaFuelStationsQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,
  useStartTripMutation,
  useCompleteTripMutation,
  useReviewTripMutation,
  useCancelTripMutation,
  useAddTripExpenseMutation,
  useUpdateConsignmentMutation,
  useExportTripsMutation,
} = tripsApi;

export default tripsApi;
