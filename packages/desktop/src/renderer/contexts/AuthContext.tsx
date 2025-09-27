import React, { createContext, useContext, useEffect, useState } from 'react';
import jwtDecode from 'jwt-decode';
import { User } from '@skype-clone/shared';
import apiService from '../services/apiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (!window.electronAPI) {
        setIsLoading(false);
        return;
      }

      const storedToken = await window.electronAPI.storeGet('authToken');
      const storedRefreshToken = await window.electronAPI.storeGet('refreshToken');

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
      const response = await apiService.login({ email, password });

      const { accessToken, refreshToken, user: userData } = response.data;

      if (window.electronAPI) {
        await window.electronAPI.storeSet('authToken', accessToken);
        await window.electronAPI.storeSet('refreshToken', refreshToken);
      }

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
      const response = await apiService.register(userData);

      const { accessToken, refreshToken, user: newUser } = response.data;

      if (window.electronAPI) {
        await window.electronAPI.storeSet('authToken', accessToken);
        await window.electronAPI.storeSet('refreshToken', refreshToken);
      }

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
      if (window.electronAPI) {
        await window.electronAPI.storeDelete('authToken');
        await window.electronAPI.storeDelete('refreshToken');
      }
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshToken = async () => {
    try {
      if (!window.electronAPI) return;

      const storedRefreshToken = await window.electronAPI.storeGet('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.refreshToken(storedRefreshToken);

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      await window.electronAPI.storeSet('authToken', accessToken);
      await window.electronAPI.storeSet('refreshToken', newRefreshToken);

      setToken(accessToken);
      const decodedUser = jwtDecode<User>(accessToken);
      setUser(decodedUser);
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(updates);
      setUser(response.data.user);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
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
