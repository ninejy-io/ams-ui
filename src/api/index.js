import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'
import { useAuthStore } from '@/store/auth'

// create axios instance
const service = axios.create({
  baseURL: '/api/v1',
  timeout: 10000
})

// token refresh locking
let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}
function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

// request interceptor
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data

    if (res && res.code !== 200) {
      ElMessage({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })
      // console.log('Response Error:', res)

      // auth related error codes -> prompt re-login
      if (res.code === 401) {
        ElMessageBox.confirm('Login expired, please re-login', 'Confirm logout', {
          confirmButtonText: 'Re-login',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }).then(() => {
          const authStore = useAuthStore()
          authStore.logoutUser()
          location.reload()
        })
      }

      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      // return the original data payload so callers can use response.data as before
      return res
    }
  },
  async (error) => {
    const { config, response } = error
    const authStore = useAuthStore()

    // If response is 401 Unauthorized -> try refresh token flow
    if (response && response.status === 401) {
      const originalRequest = config

      // prevent infinite loop or retrying refresh/logout endpoints
      if (originalRequest._retry) {
        // already retried, force logout
        await authStore.logoutUser()
        removeToken()
        location.reload()
        return Promise.reject(error)
      }

      const url = (originalRequest.url || '').toLowerCase()
      if (url.includes('/auth/refresh') || url.includes('/auth/logout')) {
        // don't try to refresh if the failed request was the refresh/logout endpoint
        await authStore.logoutUser()
        removeToken()
        location.reload()
        return Promise.reject(error)
      }

      // if refresh already in progress, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            // set header and retry
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            resolve(service(originalRequest))
          })
        })
      }

      // start refresh
      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshResp = await authStore.refreshUserToken()
        // assume refreshUserToken updates stored token and returns new token info
        const newToken = refreshResp?.accessToken || getToken()
        onRefreshed(newToken)
        isRefreshing = false

        // retry original request with new token
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken
        return service(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        // refresh failed -> force logout
        try {
          await authStore.logoutUser()
        } catch (e) {
          console.error('logout after refresh failure error:', e)
        }
        removeToken()
        location.reload()
        return Promise.reject(refreshError)
      }
    }

    // other errors
    ElMessage({
      message: error.response?.data?.message || error.message,
      type: 'error',
      duration: 5 * 1000
    })

    return Promise.reject(error)
  }
)

export default service
