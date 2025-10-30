import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Company, AuthResponse } from '../types/auth';
import { AUTH_CONFIG } from '../utils/constants';
import {
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
} from '../utils/helpers';

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
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  updateCompany: (company: Partial<Company>) => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Mock login function (replace with actual API call)
  const login = async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    setIsLoading(true);

    try {
      // Mock API call - replace with actual implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful response
      const mockResponse: AuthResponse = {
        token: 'mock-jwt-token-' + Date.now(),
        refresh_token: 'mock-refresh-token-' + Date.now(),
        expires_in: 86400, // 24 hours
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: credentials.email,
          role: 'admin',
          company_id: 'company-1',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        company: {
          id: 'company-1',
          name: 'Acme Corporation',
          email: 'admin@acme.com',
          phone: '+234-800-123-4567',
          address: '123 Business District, Lagos',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          tin: '12345678',
          subscription_status: 'active',
          subscription_plan: 'professional',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };

      // Store auth data
      setToken(mockResponse.token);
      setUser(mockResponse.user);
      setCompany(mockResponse.company);

      setLocalStorage(AUTH_CONFIG.token_key, mockResponse.token);
      setLocalStorage(
        AUTH_CONFIG.refresh_token_key,
        mockResponse.refresh_token
      );
      setLocalStorage(AUTH_CONFIG.user_key, mockResponse.user);
      setLocalStorage(AUTH_CONFIG.company_key, mockResponse.company);

      return mockResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    setToken(null);

    removeLocalStorage(AUTH_CONFIG.token_key);
    removeLocalStorage(AUTH_CONFIG.refresh_token_key);
    removeLocalStorage(AUTH_CONFIG.user_key);
    removeLocalStorage(AUTH_CONFIG.company_key);
  };

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

  const refreshToken = async () => {
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
  };

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token) return;

    const refreshInterval = setInterval(() => {
      refreshToken();
    }, AUTH_CONFIG.refresh_threshold);

    return () => clearInterval(refreshInterval);
  }, [token]);

  const value: AuthContextType = {
    user,
    company,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUser,
    updateCompany,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
