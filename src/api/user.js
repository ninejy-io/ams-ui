import service from './index'

export function getUserList(params) {
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

export function getRoles() {
  return service({
    url: '/roles',
    method: 'get'
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
