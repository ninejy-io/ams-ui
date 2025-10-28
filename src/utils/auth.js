import { ElMessage } from 'element-plus'

export const getToken = () => {
  return localStorage.getItem('token')
}

export const setToken = (token) => {
  localStorage.setItem('token', token)
}

export const removeToken = () => {
  localStorage.removeItem('token')
}

export const handleApiError = (error) => {
  const message = error.response?.data?.message || error.message || '请求失败'
  ElMessage.error(message)
  return Promise.reject(error)
}
