import service from './index'

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
