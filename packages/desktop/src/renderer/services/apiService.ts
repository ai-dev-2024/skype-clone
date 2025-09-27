import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000/api'
  : 'https://api.skype-clone.com/api';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        let token: string | null = null;

        if (window.electronAPI) {
          token = await window.electronAPI.storeGet('authToken');
        } else {
          token = localStorage.getItem('authToken');
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;

          try {
            let refreshToken: string | null = null;

            if (window.electronAPI) {
              refreshToken = await window.electronAPI.storeGet('refreshToken');
            } else {
              refreshToken = localStorage.getItem('refreshToken');
            }

            if (refreshToken) {
              const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

              if (window.electronAPI) {
                await window.electronAPI.storeSet('authToken', accessToken);
                await window.electronAPI.storeSet('refreshToken', newRefreshToken);
              } else {
                localStorage.setItem('authToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);
              }

              error.config.headers.Authorization = `Bearer ${accessToken}`;
              return this.axiosInstance(error.config);
            }
          } catch (refreshError) {
            // Refresh failed, logout
            if (window.electronAPI) {
              await window.electronAPI.storeDelete('authToken');
              await window.electronAPI.storeDelete('refreshToken');
            } else {
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
            }
            window.location.reload();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.axiosInstance.post('/auth/login', credentials);
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }) {
    return this.axiosInstance.post('/auth/register', userData);
  }

  async refreshToken(refreshToken: string) {
    return this.axiosInstance.post('/auth/refresh', { refreshToken });
  }

  async getCurrentUser() {
    return this.axiosInstance.get('/auth/me');
  }

  // User endpoints
  async updateProfile(userData: Partial<{
    firstName: string;
    lastName: string;
    username: string;
    avatar: string;
  }>) {
    return this.axiosInstance.put('/users/profile', userData);
  }

  async getUser(userId: string) {
    return this.axiosInstance.get(`/users/${userId}`);
  }

  // Message endpoints
  async getChats() {
    return this.axiosInstance.get('/messages/chats');
  }

  async getMessages(chatId: string, page = 1, limit = 50) {
    return this.axiosInstance.get(`/messages/${chatId}`, {
      params: { page, limit },
    });
  }

  async sendMessage(chatId: string, content: string, type = 'text') {
    return this.axiosInstance.post('/messages', {
      chatId,
      content,
      type,
    });
  }

  async markAsRead(messageId: string) {
    return this.axiosInstance.put(`/messages/${messageId}/read`);
  }

  // Contact endpoints
  async getContacts() {
    return this.axiosInstance.get('/contacts');
  }

  async addContact(userId: string) {
    return this.axiosInstance.post('/contacts', { userId });
  }

  async removeContact(contactId: string) {
    return this.axiosInstance.delete(`/contacts/${contactId}`);
  }

  // Group endpoints
  async createGroup(groupData: {
    name: string;
    description?: string;
    participants: string[];
  }) {
    return this.axiosInstance.post('/groups', groupData);
  }

  async getGroup(groupId: string) {
    return this.axiosInstance.get(`/groups/${groupId}`);
  }

  async updateGroup(groupId: string, updates: Partial<{
    name: string;
    description: string;
    avatar: string;
  }>) {
    return this.axiosInstance.put(`/groups/${groupId}`, updates);
  }

  async addGroupMember(groupId: string, userId: string) {
    return this.axiosInstance.post(`/groups/${groupId}/members`, { userId });
  }

  async removeGroupMember(groupId: string, userId: string) {
    return this.axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
  }

  // Call endpoints
  async initiateCall(participants: string[], callType: 'audio' | 'video' = 'video') {
    return this.axiosInstance.post('/calls', {
      participants,
      callType,
    });
  }

  async getCallHistory() {
    return this.axiosInstance.get('/calls/history');
  }

  // Payment endpoints
  async createPaymentIntent(amount: number, currency = 'usd') {
    return this.axiosInstance.post('/payments/create-intent', {
      amount,
      currency,
    });
  }

  async getPaymentHistory() {
    return this.axiosInstance.get('/payments/history');
  }

  // Generic request methods
  get<T = any>(url: string, config?: any) {
    return this.axiosInstance.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: any) {
    return this.axiosInstance.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: any) {
    return this.axiosInstance.put<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: any) {
    return this.axiosInstance.delete<T>(url, config);
  }
}

const apiService = new ApiService();
export default apiService;
