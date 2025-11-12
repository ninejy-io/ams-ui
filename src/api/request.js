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

    // 成功响应直接返回
    if (res && res.code === 200) {
      return res
    }

    // 业务逻辑错误处理
    if (res && res.code !== 200) {
      ElMessage({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      // 认证相关错误
      if (res.code === 401) {
        return handleAuthError()
      }

      return Promise.reject(new Error(res.message || 'Error'))
    }

    return res
  },
  async (error) => {
    const { config, response } = error

    // 网络错误或服务器错误
    if (!response) {
      ElMessage({
        message: error.message || 'Network Error',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(error)
    }

    // HTTP 401 错误处理
    // if (response.status === 401) {
    //   return handleHttp401Error(config, response)
    // }

    // 其他 HTTP 错误
    ElMessage({
      message: response.data?.message || error.message,
      type: 'error',
      duration: 5 * 1000
    })

    return Promise.reject(error)
  }
)

// 处理认证错误函数
async function handleAuthError() {
  try {
    await ElMessageBox.confirm('登录已过期，请重新登录', '确认退出', {
      confirmButtonText: '重新登录',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const authStore = useAuthStore()
    await authStore.logoutUser()
    removeToken()
    // 跳转到登录页，而不是刷新页面
    window.location.href = '/login'
  } catch (cancel) {
    // 用户点击取消，不做任何操作
  }
  
  return Promise.reject(new Error('Authentication failed'))
}

// 处理 HTTP 401 错误
async function handleHttp401Error(originalConfig, response) {
  const authStore = useAuthStore()
  
  // 防止无限循环或重试刷新/登出端点
  if (originalConfig._retry) {
    await authStore.logoutUser()
    removeToken()
    window.location.href = '/login'
    return Promise.reject(new Error('Authentication failed'))
  }

  const url = (originalConfig.url || '').toLowerCase()
  if (url.includes('/auth/refresh') || url.includes('/auth/logout')) {
    await authStore.logoutUser()
    removeToken()
    window.location.href = '/login'
    return Promise.reject(new Error('Authentication failed'))
  }

  // 如果刷新已在进行中，将请求加入队列
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        originalConfig.headers['Authorization'] = 'Bearer ' + token
        resolve(service(originalConfig))
      })
    })
  }

  // 开始刷新 token
  originalConfig._retry = true
  isRefreshing = true

  try {
    const refreshResp = await authStore.refreshUserToken()
    const newToken = refreshResp?.accessToken || getToken()
    
    if (!newToken) {
      throw new Error('Refresh token failed')
    }
    
    onRefreshed(newToken)
    isRefreshing = false

    // 重试原始请求
    originalConfig.headers['Authorization'] = 'Bearer ' + newToken
    return service(originalConfig)
  } catch (refreshError) {
    isRefreshing = false
    console.error('Token refresh failed:', refreshError)
    
    try {
      await authStore.logoutUser()
    } catch (e) {
      console.error('Logout error:', e)
    }
    
    removeToken()
    window.location.href = '/login'
    return Promise.reject(refreshError)
  }
}

export default service
