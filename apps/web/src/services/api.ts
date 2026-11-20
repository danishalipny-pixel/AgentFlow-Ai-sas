import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token and active organization ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const activeOrgId = localStorage.getItem('agentflow_active_org_id');
  if (activeOrgId) {
    config.headers['x-organization-id'] = activeOrgId;
  }

  return config;
});

// Response interceptor to handle token expiry and auto-sync organization header
api.interceptors.response.use(
  (response) => {
    const returnedOrgId = response.headers?.['x-organization-id'];
    if (returnedOrgId && (!localStorage.getItem('agentflow_active_org_id') || localStorage.getItem('agentflow_active_org_id') === 'undefined')) {
      localStorage.setItem('agentflow_active_org_id', returnedOrgId);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('agentflow_refresh_token');
      if (refreshToken && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh-token')) {
        originalRequest._retry = true;
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          if (res.data?.success && res.data.data?.tokens?.accessToken) {
            const newToken = res.data.data.tokens.accessToken;
            localStorage.setItem('agentflow_token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('agentflow_token');
          localStorage.removeItem('agentflow_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
