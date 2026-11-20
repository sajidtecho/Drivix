import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi, LoginParams, RegisterParams } from '../api/authApi';
import { storage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginParams) => Promise<void>;
  register: (data: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      const savedToken = await storage.getToken();
      if (savedToken) {
        setToken(savedToken);
        const profile = await authApi.getProfile();
        setUser(profile);
      }
    } catch (err: any) {
      const isUnauthorized = err?.response?.status === 401 || err?.status === 401;
      if (isUnauthorized) {
        // Expired or invalid token: gracefully clear session without throwing an alarming yellow LogBox warning
        console.log('[AuthContext] Stored session expired or invalid. Cleared token.');
      } else {
        console.warn('[AuthContext] Session restoration notice:', err?.message || err);
      }
      await storage.removeToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (credentials: LoginParams) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      const userObj: User = (res.user || res) as User;
      if (res.token) {
        await storage.saveToken(res.token);
        setToken(res.token);
      }
      setUser(userObj);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterParams) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      const userObj: User = (res.user || res) as User;
      if (res.token) {
        await storage.saveToken(res.token);
        setToken(res.token);
      }
      setUser(userObj);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await storage.removeToken();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.status === 401) {
        await logout();
      } else {
        console.warn('[AuthContext] Profile refresh error:', err?.message || err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
