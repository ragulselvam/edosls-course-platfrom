/**
 * Centralized Type-Safe API Client for Next.js & FastAPI Backend
 */

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const api = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('platform_access_token') || localStorage.getItem('platform_access_token');
  },

  setToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (token) {
      sessionStorage.setItem('platform_access_token', token);
      localStorage.setItem('platform_access_token', token);
    } else {
      sessionStorage.removeItem('platform_access_token');
      localStorage.removeItem('platform_access_token');
    }
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('platform_user');
          localStorage.removeItem('platform_user');
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        throw new ApiError('Your session has expired. Please login again.', 401);
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.detail || data.message || `Request failed with status ${response.status}`;
        throw new ApiError(errorMsg, response.status, data);
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Network error occurred', 500);
    }
  },

  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      if (qs) url += `?${qs}`;
    }
    return this.request<T>(url, { method: 'GET' });
  },

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  },

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  },

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  },

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },

  del<T>(endpoint: string): Promise<T> {
    return this.delete<T>(endpoint);
  },

  async upload<T>(file: File, category = 'general'): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return this.request<T>('/api/files/upload', {
      method: 'POST',
      body: formData,
    });
  },
};
