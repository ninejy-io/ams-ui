// src/store/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getProfile } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'

export const useUserStore = defineStore('user', () => {
  // state
  const token = ref(getToken())
  const user = ref({})
  const roles = ref([])
  const permissions = ref([])

  // getters
  const getToken = computed(() => token.value)
  const getUser = computed(() => user.value)
  const getRoles = computed(() => roles.value)
  const getPermissions = computed(() => permissions.value)
  const getName = computed(() => user.value?.username || '')
  const getAvatar = computed(() => user.value?.avatar || '')
  const getUserId = computed(() => user.value?.id || '')

  // actions
  const loginAction = async (loginForm) => {
    try {
      const response = await login(loginForm)
      const { data } = response
      token.value = data.token
      setToken(data.token)
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const getInfoAction = async () => {
    try {
      const response = await getProfile()
      const { data } = response

      if (!data) {
        throw new Error('获取用户信息失败，请重新登录。')
      }

      const { roles, permissions, user } = data

      // 验证返回的 roles 是否非空数组
      if (!roles || roles.length === 0) {
        throw new Error('getInfo: roles 必须是非空数组!')
      }

      user.value = user
      roles.value = roles
      permissions.value = permissions

      return Promise.resolve(data)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const logoutAction = async () => {
    try {
      await logout()
      token.value = ''
      roles.value = []
      permissions.value = []
      user.value = {}
      removeToken()
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const resetToken = () => {
    token.value = ''
    roles.value = []
    permissions.value = []
    user.value = {}
    removeToken()
  }

  const updateUser = (userInfo) => {
    user.value = { ...user.value, ...userInfo }
  }

  const hasRole = (role) => {
    return roles.value.includes(role)
  }

  const hasPermission = (permission) => {
    return permissions.value.includes(permission)
  }

  const hasAnyRole = (roleList) => {
    return roleList.some(role => roles.value.includes(role))
  }

  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => permissions.value.includes(permission))
  }

  return {
    // state
    token,
    user,
    roles,
    permissions,

    // getters
    getToken,
    getUser,
    getRoles,
    getPermissions,
    getName,
    getAvatar,
    getUserId,

    // actions
    loginAction,
    getInfoAction,
    logoutAction,
    resetToken,
    updateUser,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission
  }
})

// 如果需要持久化存储，可以这样配置
export const useUserStoreWithPersist = defineStore('user', () => {
  const store = useUserStore()
  
  // 这里可以添加持久化相关的逻辑
  // 或者使用 pinia-plugin-persistedstate 插件
  
  return store
})
