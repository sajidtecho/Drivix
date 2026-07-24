import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';
import { storage } from '@/services/storage';

export interface Vehicle {
  plate: string;
  model: string;
  isPrimary: boolean;
}

export interface User {
  _id: string;
  fullName?: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  role: string;
  walletBalance: number;
  vehicles: Vehicle[];
  documents?: any[];
  isProfileCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    fullName: string,
    email: string,
    password: string,
    mobile: string,
    city: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginWithMobile: (mobile: string) => Promise<boolean>;
  clearError: () => void;
  isLoginVisible: boolean;
  setLoginVisible: (visible: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoginVisible, setLoginVisible] = useState<boolean>(false);

  // Initialize and check for existing session on startup using local JWT
  useEffect(() => {
    const initializeAuthSession = async () => {
      try {
        const storedToken = await storage.getToken();
        if (storedToken) {
          setToken(storedToken);
          const response = await api.get('/auth/profile');
          if (response.data) {
            setUser(response.data);
          }
        }
      } catch (err: any) {
        console.warn('Session verification failed on start:', err.message);
        
        // Only flush token if it was a definitive authentication rejection (401 or 403).
        const isAuthError = err.response && (err.response.status === 401 || err.response.status === 403);
        if (isAuthError) {
          console.log('Authentication invalid, flushing token');
          await storage.removeToken();
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuthSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      
      const tokenVal = data.token;
      if (tokenVal) {
        await storage.saveToken(tokenVal);
        setToken(tokenVal);
        setUser(data);
        setIsLoading(false);
        return true;
      }
      throw new Error('Authentication response did not contain a valid token');
    } catch (err: any) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(errMsg);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    mobile: string,
    city: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', {
        name: fullName,
        email,
        password,
        mobile,
        city,
      });
      const data = response.data;

      const tokenVal = data.token;
      if (tokenVal) {
        await storage.saveToken(tokenVal);
        setToken(tokenVal);
        setUser(data);
        setIsLoading(false);
        return true;
      }
      throw new Error('Registration response did not contain a valid token');
    } catch (err: any) {
      console.error('Registration error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Registration failed';
      setError(errMsg);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await storage.removeToken();
      setToken(null);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data) {
        setUser(response.data);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const loginWithMobile = async (mobile: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const cleanedMobile = mobile.replace('+91', '').replace(/\D/g, '');
      const response = await api.post('/auth/phone', { mobile: cleanedMobile });
      const data = response.data;
      if (data && data.token) {
        await storage.saveToken(data.token);
        setToken(data.token);
        setUser(data);
        setIsLoading(false);
        return true;
      }
      throw new Error('Authentication response did not contain a valid token');
    } catch (err: any) {
      console.error('Mobile login error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Mobile login failed';
      setError(errMsg);
      setIsLoading(false);
      return false;
    }
  };

  const clearError = () => setError(null);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshProfile,
        loginWithMobile,
        clearError,
        isLoginVisible,
        setLoginVisible,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default useAuth;
