import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, refreshToken, getProfile } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getToken())
  const user = ref(null)
  const permissions = ref([])

  const isAuthenticated = computed(() => !!token.value)

  const loginUser = async (loginData) => {
    try {
      const response = await login(loginData)
      token.value = response.data.token
      user.value = response.data.user
      setToken(response.data.token)
      return response
    } catch (error) {
      throw error
    }
  }

  const logoutUser = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      token.value = null
      user.value = null
      permissions.value = []
      removeToken()
    }
  }

  const refreshUserToken = async () => {
    try {
      const response = await refreshToken({ token: token.value })
      token.value = response.data.token
      setToken(response.data.token)
      return response
    } catch (error) {
      await logoutUser()
      throw error
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await getProfile()
      user.value = response.data
      return response
    } catch (error) {
      throw error
    }
  }

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    loginUser,
    logoutUser,
    refreshUserToken,
    fetchUserProfile
  }
})
