import service from './index'

export function getUsers(params) {
  return service({
    url: '/users',
    method: 'get',
    params
  })
}

export function getUser(id) {
  return service({
    url: `/users/${id}`,
    method: 'get'
  })
}

export function createUser(data) {
  return service({
    url: '/users',
    method: 'post',
    data
  })
}

export function updateUser(id, data) {
  return service({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

export function deleteUser(id) {
  return service({
    url: `/users/${id}`,
    method: 'delete'
  })
}

export function updateUserStatus(id, status) {
  return service({
    url: `/users/${id}/status`,
    method: 'put',
    data: { status }
  })
}

export function changePassword(id, data) {
  return service({
    url: `/users/${id}/password`,
    method: 'put',
    data
  })
}

export function resetPassword(id, data) {
  return service({
    url: `/users/${id}/reset-password`,
    method: 'put',
    data
  })
}

export function register(data) {
  return service({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export function login(data) {
  return service({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function logout() {
  return service({
    url: '/auth/logout',
    method: 'post'
  })
}

export function refreshToken(data) {
  return service({
    url: '/auth/refresh',
    method: 'post',
    data
  })
}

export function getProfile() {
  return service({
    url: '/users/profile',
    method: 'get'
  })
}

export function updateProfile(data) {
    return service({
    url: '/users/profile',
    method: 'put',
    data
  })
}

export function getRoles() {
  return service({
    url: '/roles',
    method: 'get'
  })
}

export function createRole(data) {
  return service({
    url: '/roles',
    method: 'post',
    data
  })
}

export function updateRole(id, data) {
  return service({
    url: `/roles/${id}`,
    method: 'put',
    data
  })
}

export function deleteRole(id) {
  return service({
    url: `/roles/${id}`,
    method: 'delete'
  })
}

export function assignRole(userId, roleId) {
  return service({
    url: `/users/${userId}/assign-role`,
    method: 'put',
    data: { role_id: roleId }
  })
}

export function searchUsers(params) {
  return service({
    url: '/users/search',
    method: 'get',
    params
  })
}

export function bulkUpdateUserStatus(data) {
  return service({
    url: '/users/bulk-status',
    method: 'put',
    data
  })
}
