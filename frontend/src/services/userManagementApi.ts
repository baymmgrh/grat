import { api } from '../store/api'

// Types
export interface User {
  id: number
  username: string
  email: string
  full_name: string
  is_active: boolean
  is_admin: boolean
  last_login?: string
  created_at: string
  roles: Role[]
}

export interface Role {
  id: number
  name: string
  description: string
  is_active: boolean
  created_at: string
  permissions: Permission[]
  user_count: number
}

export interface Permission {
  id: number
  name: string
  description: string
  module: string
  action: string
  is_active: boolean
  created_at: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  full_name: string
  is_active?: boolean
  is_admin?: boolean
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  password?: string
  full_name?: string
  is_active?: boolean
  is_admin?: boolean
}

export interface CreateRoleRequest {
  name: string
  description?: string
  is_active?: boolean
  permissions?: number[]
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
  is_active?: boolean
  permissions?: number[]
}

export interface CreatePermissionRequest {
  name: string
  description?: string
  module: string
  action: string
  is_active?: boolean
}

export interface AssignRolesRequest {
  role_ids: number[]
}

// API endpoints
export const userManagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // User endpoints
    getUsers: builder.query<{ users: User[] }, void>({
      query: () => '/settings/users',
      providesTags: ['UsersIcon'],
    }),

    createUser: builder.mutation<{ message: string; user: User }, CreateUserRequest>({
      query: (userData) => ({
        url: '/settings/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['UsersIcon'],
    }),

    updateUser: builder.mutation<{ message: string; user: User }, { id: number; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/settings/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['UsersIcon'],
    }),

    deleteUser: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/settings/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UsersIcon'],
    }),

    // Role endpoints
    getRoles: builder.query<{ roles: Role[] }, void>({
      query: () => '/settings/roles',
      providesTags: ['Roles'],
    }),

    createRole: builder.mutation<{ message: string; role: Role }, CreateRoleRequest>({
      query: (roleData) => ({
        url: '/settings/roles',
        method: 'POST',
        body: roleData,
      }),
      invalidatesTags: ['Roles', 'UsersIcon'],
    }),

    updateRole: builder.mutation<{ message: string; role: Role }, { id: number; data: UpdateRoleRequest }>({
      query: ({ id, data }) => ({
        url: `/settings/roles/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Roles', 'UsersIcon'],
    }),

    deleteRole: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/settings/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles', 'UsersIcon'],
    }),

    // Permission endpoints
    getPermissions: builder.query<{ permissions: Permission[] }, void>({
      query: () => '/settings/permissions',
      providesTags: ['Permissions'],
    }),

    createPermission: builder.mutation<{ message: string; permission: Permission }, CreatePermissionRequest>({
      query: (permissionData) => ({
        url: '/settings/permissions',
        method: 'POST',
        body: permissionData,
      }),
      invalidatesTags: ['Permissions', 'Roles'],
    }),

    // User role assignment
    assignUserRoles: builder.mutation<{ message: string; assigned_roles: number }, { userId: number; data: AssignRolesRequest }>({
      query: ({ userId, data }) => ({
        url: `/settings/users/${userId}/roles`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['UsersIcon', 'Roles'],
    }),

    removeUserRole: builder.mutation<{ message: string }, { userId: number; roleId: number }>({
      query: ({ userId, roleId }) => ({
        url: `/settings/users/${userId}/roles/${roleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['UsersIcon', 'Roles'],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useAssignUserRolesMutation,
  useRemoveUserRoleMutation,
} = userManagementApi
