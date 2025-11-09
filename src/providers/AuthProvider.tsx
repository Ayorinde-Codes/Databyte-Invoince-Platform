import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Company, AuthResponse, AuthApiResponse } from '../types/auth';
import { AUTH_CONFIG } from '../utils/constants';
import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
} from '../utils/helpers';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<AuthResponse>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    tin: string;
  }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  updateCompany: (company: Partial<Company>) => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = getLocalStorage(AUTH_CONFIG.token_key, null);
        const storedUser = getLocalStorage(AUTH_CONFIG.user_key, null);
        const storedCompany = getLocalStorage(AUTH_CONFIG.company_key, null);

        if (storedToken && storedUser && storedCompany) {
          setToken(storedToken);
          setUser(storedUser);
          setCompany(storedCompany);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        removeLocalStorage(AUTH_CONFIG.token_key);
        removeLocalStorage(AUTH_CONFIG.user_key);
        removeLocalStorage(AUTH_CONFIG.company_key);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Real login function
  const login = async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      const response = await apiService.login(credentials);

      if (!response.status || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      const { token, user } = response.data;
      const company = user.company;

      // Store auth data
      setToken(token);
      setUser(user);
      setCompany(company);

      setLocalStorage(AUTH_CONFIG.token_key, token);
      setLocalStorage(AUTH_CONFIG.user_key, user);
      setLocalStorage(AUTH_CONFIG.company_key, company);

      return response.data;
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Real register function
  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    tin: string;
  }): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      const response = await apiService.register(userData);

      if (!response.status || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }

      const { token, user } = response.data;
      const company = user.company;

      // Store auth data
      setToken(token);
      setUser(user);
      setCompany(company);

      setLocalStorage(AUTH_CONFIG.token_key, token);
      setLocalStorage(AUTH_CONFIG.user_key, user);
      setLocalStorage(AUTH_CONFIG.company_key, company);

      return response.data;
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setCompany(null);
      setToken(null);
    }
  }, []);

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      setLocalStorage(AUTH_CONFIG.user_key, updatedUser);
    }
  };

  const updateCompany = (companyData: Partial<Company>) => {
    if (company) {
      const updatedCompany = { ...company, ...companyData };
      setCompany(updatedCompany);
      setLocalStorage(AUTH_CONFIG.company_key, updatedCompany);
    }
  };

  const refreshToken = useCallback(async () => {
    try {
      const storedRefreshToken = getLocalStorage(
        AUTH_CONFIG.refresh_token_key,
        null
      );

      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      // Mock refresh token API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newToken = 'refreshed-jwt-token-' + Date.now();
      setToken(newToken);
      setLocalStorage(AUTH_CONFIG.token_key, newToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  }, [logout]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token) return;

    const refreshInterval = setInterval(() => {
      refreshToken();
    }, AUTH_CONFIG.refresh_threshold);

    return () => clearInterval(refreshInterval);
  }, [token, refreshToken]);

  const value: AuthContextType = {
    user,
    company,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    updateCompany,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
