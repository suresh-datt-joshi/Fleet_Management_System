import { baseApi } from './baseApi';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: [{ type: 'Admin', id: 'STATS' }],
    }),
    getRoles: builder.query({
      query: () => '/admin/roles',
      providesTags: [{ type: 'Admin', id: 'ROLES' }],
    }),
    getPermissions: builder.query({
      query: () => '/admin/permissions',
      providesTags: [{ type: 'Admin', id: 'PERMISSIONS' }],
    }),
    getUsers: builder.query({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: (result) =>
        result?.data?.users
          ? [
              ...result.data.users.map(({ id }) => ({ type: 'AdminUser', id })),
              { type: 'AdminUser', id: 'LIST' },
            ]
          : [{ type: 'AdminUser', id: 'LIST' }],
    }),
    getUser: builder.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminUser', id }],
    }),
    getSettings: builder.query({
      query: () => '/admin/settings',
      providesTags: [{ type: 'Admin', id: 'SETTINGS' }],
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: '/admin/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'AdminUser', id: 'LIST' },
        { type: 'Admin', id: 'STATS' },
      ],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AdminUser', id },
        { type: 'AdminUser', id: 'LIST' },
        { type: 'Admin', id: 'STATS' },
      ],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'AdminUser', id: 'LIST' },
        { type: 'Admin', id: 'STATS' },
      ],
    }),
    resetUserPassword: builder.mutation({
      query: ({ id, password }) => ({
        url: `/admin/users/${id}/reset-password`,
        method: 'POST',
        body: { password },
      }),
    }),
    updateSettings: builder.mutation({
      query: (body) => ({
        url: '/admin/settings',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Admin', id: 'SETTINGS' }],
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetRolesQuery,
  useGetPermissionsQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useGetSettingsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useResetUserPasswordMutation,
  useUpdateSettingsMutation,
} = adminApi;

export default adminApi;
