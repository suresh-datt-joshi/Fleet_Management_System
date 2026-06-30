import { baseApi } from './baseApi';

export const mapsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMapsConfig: builder.query({
      query: () => '/maps/config',
      providesTags: ['Maps'],
    }),
    geocodeAddress: builder.mutation({
      query: (body) => ({
        url: '/maps/geocode',
        method: 'POST',
        body,
      }),
    }),
    reverseGeocode: builder.mutation({
      query: (body) => ({
        url: '/maps/reverse-geocode',
        method: 'POST',
        body,
      }),
    }),
    getDirections: builder.mutation({
      query: (body) => ({
        url: '/maps/directions',
        method: 'POST',
        body,
      }),
    }),
    getDistanceMatrix: builder.mutation({
      query: (body) => ({
        url: '/maps/distance-matrix',
        method: 'POST',
        body,
      }),
    }),
    getStaticMap: builder.query({
      query: (params) => ({
        url: '/maps/static',
        params,
      }),
    }),
  }),
});

export const {
  useGetMapsConfigQuery,
  useGeocodeAddressMutation,
  useReverseGeocodeMutation,
  useGetDirectionsMutation,
  useGetDistanceMatrixMutation,
  useGetStaticMapQuery,
} = mapsApi;

export default mapsApi;
