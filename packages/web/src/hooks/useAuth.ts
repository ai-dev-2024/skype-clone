import { useState, useEffect } from 'react'
import { User } from '@skype-clone/shared'
import { authAPI } from '../services/api'
import { socketService } from '../services/socket'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setAuthState({ user: null, loading: false, error: null })
        return
      }

      const response = await authAPI.getMe()
      const currentUser = response.data?.data || null
      setAuthState({ user: currentUser, loading: false, error: null })
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      setAuthState({ user: null, loading: false, error: null })
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })
      const { token, refreshToken, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)

      // Connect to socket after successful login
      if (user) {
        socketService.connect(user.id, token)
      }

      setAuthState({ user: user || null, loading: false, error: null })
      return user
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, error: error.response?.data?.error || 'Login failed' }))
      throw error
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData)
      const { token, refreshToken, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)

      setAuthState({ user: user || null, loading: false, error: null })
      return user
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, error: error.response?.data?.error || 'Registration failed' }))
      throw error
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      // Even if logout fails on server, we should clear local storage
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      setAuthState({ user: null, loading: false, error: null })
    }
  }

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    login,
    register,
    logout,
    isAuthenticated: !!authState.user
  }
}
