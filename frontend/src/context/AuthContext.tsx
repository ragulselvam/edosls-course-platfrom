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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const savedToken = api.getToken();
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    try {
      const freshUser = await api.get<User>('/api/auth/me');
      setUser(freshUser);
      setToken(savedToken);
      sessionStorage.setItem('platform_user', JSON.stringify(freshUser));
      return freshUser;
    } catch {
      api.setToken(null);
      sessionStorage.removeItem('platform_user');
      setUser(null);
      setToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Read cached user first for instant hydration
    try {
      const cached = sessionStorage.getItem('platform_user') || localStorage.getItem('platform_user');
      if (cached) {
        setUser(JSON.parse(cached));
        setToken(api.getToken());
      }
    } catch {
      // ignore JSON parse error
    }

    refreshUser();

    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      toast('Your session has expired. Please login again.', 'warning');
      router.push('/login');
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

      toast(`Welcome back, ${res.user.first_name || 'User'}!`, 'success');

      // Direct to corresponding dashboard
      const dashPath = getDashboardPath(res.user.role_name);
      router.push(dashPath);
      return res.user;
    } catch (err: any) {
      toast(err.message || 'Invalid credentials', 'error');
      throw err;
    } finally {
      setIsLoading(false);
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
