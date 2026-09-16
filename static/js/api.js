/**
 * Centralized API Client with JWT Auth, Error Toasts, and Request Interception
 */
const API = {
  getToken() {
    return sessionStorage.getItem('platform_access_token') || sessionStorage.getItem('platform_token');
  },
  
  setToken(token) {
    if (token) {
      sessionStorage.setItem('platform_access_token', token);
      sessionStorage.setItem('platform_token', token);
    } else {
      sessionStorage.removeItem('platform_access_token');
      sessionStorage.removeItem('platform_token');
    }
    // Clean up any legacy localStorage tokens to ensure complete tab isolation
    try {
      localStorage.removeItem('platform_access_token');
      localStorage.removeItem('platform_token');
      localStorage.removeItem('platform_user');
    } catch(e) {}
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    // If body is not FormData, add JSON header
    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      // Handle 401 Unauthorized
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        this.setToken(null);
        sessionStorage.removeItem('platform_user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error('Your session has expired. Please login again.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.detail || data.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      this.toast(err.message || 'Network error occurred', 'error');
      throw err;
    }
  },

  get(endpoint, params = null) {
    let url = endpoint;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      if (qs) url += `?${qs}`;
    }
    return this.request(url, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  patch(endpoint, body = null) {
    return this.request(endpoint, { method: 'PATCH', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  async upload(file, category = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return this.request('/api/files/upload', {
      method: 'POST',
      body: formData
    });
  },

  toast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};
