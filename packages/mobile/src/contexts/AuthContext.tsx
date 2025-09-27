import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import {User} from '@skype-clone/shared';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = __DEV__
  ? 'http://localhost:5000/api'
  : 'https://api.skype-clone.com/api';

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');

      if (storedToken) {
        const decodedUser = jwtDecode<User>(storedToken);
        const currentTime = Date.now() / 1000;

        // Check if token is expired
        if (decodedUser.exp && decodedUser.exp < currentTime) {
          if (storedRefreshToken) {
            await refreshToken();
          } else {
            await logout();
          }
        } else {
          setToken(storedToken);
          setUser(decodedUser);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const {accessToken, refreshToken, user: userData} = response.data;

      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);

      setToken(accessToken);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);

      const {accessToken, refreshToken, user: newUser} = response.data;

      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);

      setToken(accessToken);
      setUser(newUser);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: storedRefreshToken,
      });

      const {accessToken, refreshToken: newRefreshToken} = response.data;

      await AsyncStorage.setItem('authToken', accessToken);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);

      setToken(accessToken);
      const decodedUser = jwtDecode<User>(accessToken);
      setUser(decodedUser);
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      throw error;
    }
  };

  // Set up axios interceptors for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      config => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          try {
            await refreshToken();
            error.config.headers.Authorization = `Bearer ${token}`;
            return axios(error.config);
          } catch (refreshError) {
            await logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
