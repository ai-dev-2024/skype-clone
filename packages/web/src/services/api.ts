import axios from 'axios'
import { User } from '@skype-clone/shared'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })

          const { token, refreshToken: newRefreshToken } = response.data
          localStorage.setItem('token', token)
          localStorage.setItem('refreshToken', newRefreshToken)

          // Retry the original request
          const originalRequest = error.config
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  username: string
}

export const authAPI = {
  login: (data: LoginData) => api.post('/auth/login', data),
  register: (data: RegisterData) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  updateProfile: (data: Partial<User>) => api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
}

export const messagesAPI = {
  getConversation: (userId: string, page?: number, limit?: number) =>
    api.get(`/messages/${userId}`, { params: { page, limit } }),
  getGroupMessages: (groupId: string, page?: number, limit?: number) =>
    api.get(`/messages/group/${groupId}`, { params: { page, limit } }),
  sendMessage: (data: {
    receiverId?: string
    groupId?: string
    content: string
    type?: 'text' | 'image' | 'file' | 'audio' | 'video'
    fileUrl?: string
    fileName?: string
    fileSize?: number
  }) => api.post('/messages', data),
  markAsRead: (messageIds: string[]) => api.put('/messages/read', { messageIds }),
  getUnreadCount: () => api.get('/messages/unread/count'),
}

export const callsAPI = {
  getCallHistory: (page?: number, limit?: number) =>
    api.get('/calls/history', { params: { page, limit } }),
  getActiveCalls: () => api.get('/calls/active'),
  initiateCall: (data: {
    receiverId?: string
    groupId?: string
    type: 'audio' | 'video'
  }) => api.post('/calls', data),
  acceptCall: (callId: string) => api.put(`/calls/${callId}/accept`),
  declineCall: (callId: string) => api.put(`/calls/${callId}/decline`),
  endCall: (callId: string) => api.put(`/calls/${callId}/end`),
}

export const contactsAPI = {
  getContacts: () => api.get('/contacts'),
  getPendingRequests: () => api.get('/contacts/requests/pending'),
  sendRequest: (userId: string) => api.post(`/contacts/request/${userId}`),
  acceptRequest: (userId: string) => api.put(`/contacts/accept/${userId}`),
  blockContact: (userId: string) => api.put(`/contacts/block/${userId}`),
  unblockContact: (userId: string) => api.put(`/contacts/unblock/${userId}`),
  searchUsers: (query: string, limit?: number) =>
    api.get('/contacts/search', { params: { q: query, limit } }),
}

export const groupsAPI = {
  getUserGroups: () => api.get('/groups'),
  getGroup: (groupId: string) => api.get(`/groups/${groupId}`),
  createGroup: (data: {
    name: string
    description?: string
    members?: string[]
    isPrivate?: boolean
  }) => api.post('/groups', data),
  updateGroup: (groupId: string, data: {
    name?: string
    description?: string
    avatar?: string
  }) => api.put(`/groups/${groupId}`, data),
  addMember: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/members/${userId}`),
  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`),
  leaveGroup: (groupId: string) => api.delete(`/groups/${groupId}/leave`),
}

export const paymentsAPI = {
  createPaymentIntent: (data: {
    amount: number
    currency?: string
    description?: string
  }) => api.post('/payments/create-intent', data),
  getPaymentHistory: (page?: number, limit?: number) =>
    api.get('/payments/history', { params: { page, limit } }),
  getPaymentById: (paymentId: string) => api.get(`/payments/${paymentId}`),
}

export default api
