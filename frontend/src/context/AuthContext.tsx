"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, api as apiClient } from '@/lib/api';
import { User, RoleName } from '@/types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: RoleName | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  getDashboardPath: (role?: RoleName) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem('platform_user') || localStorage.getItem('platform_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return api.getToken();
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const t = api.getToken();
    if (!t) return false;
    const cached = sessionStorage.getItem('platform_user') || localStorage.getItem('platform_user');
    return !cached;
  });

  const router = useRouter();
  const { toast } = useToast();

  const getDashboardPath = useCallback((r?: RoleName): string => {
    const targetRole = r || user?.role_name;
    if (targetRole === 'super_admin') return '/super-admin';
    if (targetRole === 'college_admin') return '/college-admin';
    if (targetRole === 'trainer') return '/trainer';
    if (targetRole === 'student') return '/student';
    return '/';
  }, [user]);

  const refreshUser = useCallback(async (showLoading = false): Promise<User | null> => {
    const savedToken = api.getToken();
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const freshUser = await api.get<User>('/api/auth/me');
      setUser(freshUser);
      setToken(savedToken);
      sessionStorage.setItem('platform_user', JSON.stringify(freshUser));
      localStorage.setItem('platform_user', JSON.stringify(freshUser));
      return freshUser;
    } catch {
      api.setToken(null);
      sessionStorage.removeItem('platform_user');
      localStorage.removeItem('platform_user');
      setUser(null);
      setToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Non-blocking background revalidation
    refreshUser(false);

    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      toast('Your session has expired. Please login again.', 'warning');
      router.replace('/login');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [refreshUser, router, toast]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{ access_token: string; token_type: string; user: User }>(
        '/api/auth/login',
        { email: email.trim(), password }
      );

      apiClient.setToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      sessionStorage.setItem('platform_user', JSON.stringify(res.user));
      localStorage.setItem('platform_user', JSON.stringify(res.user));

      toast(`Welcome back, ${res.user.first_name || 'User'}!`, 'success');

      // Direct to corresponding dashboard immediately
      const dashPath = getDashboardPath(res.user.role_name);
      setIsLoading(false);
      router.replace(dashPath);
      return res.user;
    } catch (err: any) {
      setIsLoading(false);
      toast(err.message || 'Invalid credentials', 'error');
      throw err;
    }
  };

  const logout = () => {
    apiClient.setToken(null);
    sessionStorage.removeItem('platform_user');
    localStorage.removeItem('platform_user');
    setUser(null);
    setToken(null);
    toast('You have been logged out.', 'info');
    router.push('/login');
  };

  const role = user?.role_name || null;
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
