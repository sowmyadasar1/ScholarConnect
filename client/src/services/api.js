import axios from 'axios';

/**
 * Axios API Client
 * 
 * Central HTTP client for all backend communication.
 * Handles both formats of VITE_API_URL:
 *   - https://scholarconnect-fpsg.onrender.com
 *   - https://scholarconnect-fpsg.onrender.com/api
 * Always normalizes to end with /api.
 */
function getBaseURL() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return 'http://localhost:5002/api';
  
  // Strip trailing slash
  let url = envUrl.replace(/\/+$/, '');
  // Ensure it ends with /api
  if (!url.endsWith('/api')) {
    url = url + '/api';
  }
  return url;
}

const API_BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000, // 15 second timeout
});

// Request Interceptor: Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Don't redirect if we're already on login or auth callback
      if (currentPath !== '/login' && currentPath !== '/auth/callback') {
        localStorage.removeItem('token');
        window.location.href = '/login?error=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
